# Torubleshoot
Mitm-play was tested on Windows 10 & WSL2 (Ubuntu), other system not tested yet, will need volunteer for testing on other system

## Routing rules was not match 
*Question* : having simple routing but mitm-play never use that route
```js
skip: [`some-3rd-domain.com/path`],
```
*Answer* : if the domain was not the same as namespace, mitm-play relay to Origin or Referer to match the namespace, in your case above, most likely Origin or Referer is not match with namespace.

## Connection Abruptly close by BE
*Question* : having this error in the console: `(node:5280) UnhandledPromiseRejectionWarning: FetchError: request to https://some-domain.com/with/path`

*Answer* : the server was closing abruptly, sometime along the line you can see message `reason: getaddrinfo ENOENT`. you can add rule to skip that route back to browser to handle it
```js
skip: [`some-domain.com/with/path`],
```

## Windows
Issue on powershell when `mitm-play` getting executed: `...mitm-play.ps1 cannot be loaded because running scripts is disabled on this system."`, work-around by updating policy:
```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Browser (Chromium)
- chromium - incognito, no video _*_
- firefox - stale after page full load
- webkit - response will render text not html

_*_ recomended

## Only the first tab will have the mitm
currently the intention is to stabilize base features, and isolate the bug only on first tab

## Playing video in playwright (firefox on WSL2 works!)
when testing on twitter with auto play video, target system need to have video codec installed 

WSL2 - below is the step if the `apt update` failed <br> 
https://stackoverflow.com/questions/61281700/cannot-perform-apt-update-closed
https://github.com/microsoft/playwright/commit/222d01caaadad7419c4e54b4f36a6e9d41d8dc65
```
sudo sed -i -e 's/archive.ubuntu.com\|security.ubuntu.com/ \
  old-releases.ubuntu.com/g' /etc/apt/sources.list

grep -E 'archive.ubuntu.com|security.ubuntu.com' /etc/apt/sources.list.d/*

sudo apt-get update
sudo apt install -y ffmpeg
sudo apt install -y chromium-browser
```
