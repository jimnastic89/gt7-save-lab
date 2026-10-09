from pathlib import Path
root = Path(__file__).resolve().parent
out = root / 'build'
out.mkdir(exist_ok=True)
with (out / 'assets.h').open('w') as f:
    for filename, symbol in [('index.html', 'index_html'), ('core.js', 'core_js'), ('app.js', 'app_js')]:
        data = (root / 'web' / filename).read_bytes()
        f.write('static const unsigned char ' + symbol + '[] = {\n')
        for i in range(0, len(data), 32):
            f.write(','.join(str(v) for v in data[i:i+32]) + ',\n')
        f.write('};\n')
with (out / 'launcher_assets.h').open('w') as f:
    for filename,symbol in [('param.json','launcher_param'),('icon0.png','launcher_icon')]:
        data=(root/'assets'/filename).read_bytes()
        f.write('static const unsigned char '+symbol+'[] = {\n')
        for i in range(0,len(data),32):f.write(','.join(str(v) for v in data[i:i+32])+',\n')
        f.write('};\n')
