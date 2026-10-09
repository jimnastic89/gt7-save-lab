"""Linux host integration tests. Only writes a temporary copy of a fixture."""
from pathlib import Path
import http.client
import json
import shutil
import socket
import struct
import subprocess
import tempfile
import time
import unittest

ROOT=Path(__file__).resolve().parents[1]
FIXTURE=ROOT/'download_analysis/3/gt7save.bin'


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.folder=Path(cls.temp.name)
        cls.save=cls.folder/'gt7save.bin'
        cls.backups=cls.folder/'backups'
        shutil.copyfile(FIXTURE,cls.save)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1]
        cls.proc=subprocess.Popen([str(ROOT/'build/gt7-save-lab-host'),'--file',str(cls.save),'--backups',str(cls.backups),'--port',str(cls.port)],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        for _ in range(100):
            try:
                code,body=cls.request('GET','/api/info')
                cls.token=json.loads(body)['token'];break
            except (OSError,KeyError):time.sleep(.05)
        else:raise RuntimeError('Server failed to start')

    @classmethod
    def tearDownClass(cls):
        cls.proc.kill();cls.proc.communicate();cls.temp.cleanup()

    @classmethod
    def request(cls,method,url,body=None,headers=None):
        conn=http.client.HTTPConnection('127.0.0.1',cls.port,timeout=5)
        conn.request(method,url,body=body,headers=headers or {})
        response=conn.getresponse();data=response.read();code=response.status;conn.close();return code,data

    def setUp(self):
        self.original=FIXTURE.read_bytes();self.save.write_bytes(self.original)
        self.auth={'X-Editor-Token':self.token,'Content-Type':'application/octet-stream'}

    def patch(self):
        data=bytearray(self.original);offset=0
        while offset<len(data):
            length=struct.unpack_from('<I',data,offset+12)[0]
            name=data[offset+24:offset+56].split(b'\0')[0]
            if name==b'PROGRESS':
                struct.pack_into('>I',data,offset+56+0x152,12000);return bytes(data)
            offset+=56+length
        raise AssertionError('PROGRESS missing')

    def test_read_and_assets(self):
        self.assertEqual(self.request('GET','/api/save',headers=self.auth),(200,self.original))
        for route in ('/','/core.js','/app.js'):
            code,data=self.request('GET',route);self.assertEqual(code,200);self.assertTrue(data)

    def test_write_and_verified_backup(self):
        edited=self.patch()
        code,body=self.request('POST','/api/apply',self.original+edited,self.auth)
        self.assertEqual(code,200,body)
        backup=Path(json.loads(body)['backup'])
        self.assertEqual(backup.read_bytes(),self.original)
        self.assertEqual(self.save.read_bytes(),edited)
        # Recovery rehearsal on the disposable fixture, never the user's saves.
        shutil.copyfile(backup,self.save)
        self.assertEqual(self.request('GET','/api/save',headers=self.auth),(200,self.original))

    def test_stale_snapshot_rejected(self):
        edited=self.patch();self.save.write_bytes(edited)
        code,body=self.request('POST','/api/apply',self.original+edited,self.auth)
        self.assertEqual(code,409);self.assertIn(b'Stale snapshot',body);self.assertEqual(self.save.read_bytes(),edited)

    def test_header_edits_rejected(self):
        edited=bytearray(self.original);edited[16]^=1
        code,_=self.request('POST','/api/apply',self.original+edited,self.auth)
        self.assertEqual(code,409);self.assertEqual(self.save.read_bytes(),self.original)

    def test_malformed_save_rejected(self):
        self.save.write_bytes(self.original[:-1]);code,_=self.request('GET','/api/save',headers=self.auth);self.assertEqual(code,409)

    def test_auth_origin_and_path(self):
        self.assertEqual(self.request('GET','/api/save')[0],403)
        headers={**self.auth,'Origin':'http://example.com'}
        self.assertEqual(self.request('POST','/api/apply',self.original+self.patch(),headers)[0],403)
        self.assertEqual(self.request('GET','/api/save',headers={**self.auth,'Host':'evil.example'})[0],400)
        self.assertEqual(self.request('GET','/../../etc/passwd',headers=self.auth)[0],404)
        self.assertEqual(self.save.read_bytes(),self.original)

    def test_incomplete_body_does_not_write(self):
        with socket.create_connection(('127.0.0.1',self.port)) as sock:
            request=f'POST /api/apply HTTP/1.1\r\nHost: 127.0.0.1:{self.port}\r\nX-Editor-Token: {self.token}\r\nContent-Length: 2000\r\n\r\n'
            sock.sendall(request.encode()+b'partial');sock.shutdown(socket.SHUT_WR)
            while sock.recv(4096):pass
        self.assertEqual(self.save.read_bytes(),self.original)

    def remove_gifts(self,indices):
        data=self.original;offset=0
        while offset<len(data):
            size=struct.unpack_from('<I',data,offset+12)[0]
            if data[offset+24:offset+56].split(b'\0')[0]==b'GIFTIV':break
            offset+=56+size
        payload=data[offset+56:offset+56+size]
        count=struct.unpack_from('>H',payload,64)[0]
        entries=[payload[66+count*2+i*448:66+count*2+(i+1)*448] for i in range(count) if i not in indices]
        header=bytearray(payload[:66]);struct.pack_into('>H',header,64,len(entries))
        newpayload=header+b''.join(struct.pack('>H',i) for i in range(len(entries)))+b''.join(entries)
        newdata=bytearray(data[:offset+56]+newpayload+data[offset+56+size:])
        struct.pack_into('<I',newdata,offset+12,len(newpayload))
        return newdata,offset

    def apply_v2(self,edited):
        body=b'G7P2'+struct.pack('<II',len(self.original),len(edited))+self.original+edited
        return self.request('POST','/api/apply-v2',body,self.auth)

    def test_gift_removal_and_backup(self):
        edited,_=self.remove_gifts({0,15,76})
        code,body=self.apply_v2(edited);self.assertEqual(code,200,body)
        self.assertEqual(self.save.read_bytes(),edited)
        self.assertEqual(Path(json.loads(body)['backup']).read_bytes(),self.original)

    def test_empty_gift_inventory(self):
        edited,_=self.remove_gifts(set(range(77)))
        code,body=self.apply_v2(edited);self.assertEqual(code,200,body)

    def test_gift_counter_change_rejected(self):
        edited,offset=self.remove_gifts({76});edited[offset+56+57]^=1
        self.assertEqual(self.apply_v2(edited)[0],409)
        self.assertEqual(self.save.read_bytes(),self.original)

    def test_gift_entry_change_rejected(self):
        edited,offset=self.remove_gifts({76});edited[offset+56+66+76*2+100]^=1
        self.assertEqual(self.apply_v2(edited)[0],409)
        self.assertEqual(self.save.read_bytes(),self.original)

    def test_gift_index_change_rejected(self):
        edited,offset=self.remove_gifts({76});edited[offset+56+67]=1
        self.assertEqual(self.apply_v2(edited)[0],409)

    def test_bad_envelope_rejected(self):
        body=b'G7P2'+struct.pack('<II',1,2)+self.original+self.patch()
        self.assertEqual(self.request('POST','/api/apply-v2',body,self.auth)[0],400)

    def test_host_launcher_reports_unsupported(self):
        code,body=self.request('POST','/api/install-shortcut',b'',self.auth)
        self.assertEqual(code,409);self.assertIn(b'disabled',body)

    def test_zz_stop_payload(self):
        self.assertEqual(self.request('POST','/api/stop',b'')[0],403)
        self.assertEqual(self.request('POST','/api/stop',b'',{**self.auth,'Origin':'http://example.com'})[0],403)
        self.assertEqual(self.request('GET','/api/stop',headers=self.auth)[0],404)
        code,body=self.request('POST','/api/stop',b'',self.auth)
        self.assertEqual(code,200);self.assertTrue(json.loads(body)['ok'])
        self.assertEqual(self.proc.wait(timeout=5),0)
        self.assertEqual(self.save.read_bytes(),self.original)
        with socket.socket() as sock:
            sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
            sock.bind(('127.0.0.1',self.port))


if __name__=='__main__':unittest.main(verbosity=2)
