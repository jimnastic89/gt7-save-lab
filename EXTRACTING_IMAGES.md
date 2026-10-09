# Extracting download0.dat on Windows with WSL

These GT7 download0.dat samples are UFS2 filesystem images. Extract a local copy while keeping the original as your backup. Sleuth Kit is already installed in this machine's WSL environment (version4.12.1).

Open PowerShell in C:\Users\james\Downloads\gt7-saveData and run:

```powershell
wsl.exe --exec tsk_recover -a /mnt/c/Users/james/Downloads/gt7-saveData/1_download0.dat /mnt/c/Users/james/Downloads/gt7-saveData/gt7-save-lab/download_analysis/manual-image1
```

Replace the image filename as needed and use a fresh output directory for each image. The -a option extracts allocated files (the current filesystem contents). The default without -a targets deleted/unallocated files, so do not omit it for this task. This reads the image without mounting or changing it. Extracted files appear in the Windows output folder; gt7save.bin contains the save records and can be opened in a hex editor. Binary extraction does not convert those records to readable JSON.

To list paths and inode numbers first:

```powershell
wsl.exe --exec fls -r -p /mnt/c/Users/james/Downloads/gt7-saveData/1_download0.dat
```

To extract only one file, find its inode number in that listing, then run inside WSL (replace123 with that number):

```bash
icat /mnt/c/Users/james/Downloads/gt7-saveData/1_download0.dat 123 > /mnt/c/Users/james/Downloads/gt7-saveData/gt7-save-lab/download_analysis/one-gt7save.bin
```

Use WSL/bash for binary stdout redirection; older Windows PowerShell versions can corrupt binary output when redirecting native commands. tsk_recover avoids this issue because it writes files directly.

On another Ubuntu/WSL installation, install the tools using sudo apt update and sudo apt install sleuthkit. No additional installation is necessary on the current machine.

The older root-level inspect_download_images.py helper extracts numbered images and creates hash manifests, and now writes under gt7-save-lab/download_analysis. Its output paths can overwrite an existing numbered extraction, so prefer the manual command with a fresh directory for exploratory work. Do not replace download0.dat with gt7save.bin: the former is the full filesystem image, the latter is one contained file.
