# mitm-play
Man in the middle using playwright


## Limitation (WSL2)
this limitation was tested on WSl2, other system not tested yet, looking up for volunter

### Browser (Chromium)
- chromium - incognito, no video
- firefox - stale after page full load
- webkit - response will render text not html

### Playing video in playwright (firefox on WSL2 works!)
when testing on twitter with auto play video, target system need to have video codec installed 

WSL2 - fix if the apt update failed <br> 
https://stackoverflow.com/questions/61281700/cannot-perform-apt-update-closed
https://github.com/microsoft/playwright/commit/222d01caaadad7419c4e54b4f36a6e9d41d8dc65
```
sudo sed -i -e 's/archive.ubuntu.com\|security.ubuntu.com/ \
  old-releases.ubuntu.com/g' /etc/apt/sources.list

grep -E 'archive.ubuntu.com|security.ubuntu.com' /etc/apt/sources.list.d/*

sudo apt-get update
sudo apt install -y ffmpeg
```
