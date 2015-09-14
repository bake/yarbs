# Yet Another Rocket Beans TV Sendeplan

Ein RBTV-Sendeplan, der die offizielle API abgreift und so die selben Termine wie [die App](https://play.google.com/store/apps/details?id=tv.rocketbeans.pocketbeans) anzeigt. Whoo \o/

![Screenshot](/screen.png?raw=true)

Icon by [Many](https://thenounproject.com/term/space-helmet/66004/).

# Installation

Für Benarichtigungen wird [node-notifier](https://github.com/mikaelbr/node-notifier) verwendet, was eventuell [Abhängigkeiten](https://github.com/mikaelbr/node-notifier#requirements) benötigt.

# Development

Um das Programm selbst bauen zu können, wird ein API-Key benötigt. Meldet euch dafür direkt bei @[maexdaemaege](https://twitter.com/maexdaemaege) von den Bohnen.

Danach kann die [`config.js.example`](https://github.com/BakeRolls/yarbs/blob/master/config.js.example) umbenannt und um den eigenen Key ergäzt werden.

Nach einem `npm install` sollten nun alle Abhängigkeiten vorhanden sein, um die App zu starten. Was noch fehlt, ist das CSS. [`index.styl`](https://github.com/BakeRolls/yarbs/blob/master/www/assets/css/index.styl) muss mit [Stylus](https://learnboost.github.io/stylus/) kompiliert werden. Ist das getan, ...

... kann sie mit `npm start` zum ersten mal gestartet bzw. mit `npm run build` gebaut werden.

Auf welches System das Paket ausgerichtet sein soll, kann in der [`package.json`](https://github.com/BakeRolls/yarbs/blob/master/package.json) in der `build`-Zeile angegeben werden. Was in eurem Fall dort hin gehört, findet sich auf direkt beim [electron-packager](https://github.com/maxogden/electron-packager).

Unter Linux muss Electron mit `--enable-transparent-visuals --disable-gpu` gestartet werden, [damit das Fenster einen transparenten Hintergrund bekommt](https://github.com/atom/electron/blob/master/docs/api/frameless-window.md#limitations).
