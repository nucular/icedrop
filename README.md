icedrop
=======

Icedrop is a stream selector/web player/visualization for Icecast servers. It
provides a clean interface and shiny effects.

Installation
------------

Clone or [download](https://github.com/nucular/icedrop/archive/master.zip)
icedrop and throw it somewhere onto your Icecast server. Open `app.js` and set
the line `app.server = "http://path.to.your.server:PORT";`. If you want your
users to connect to a mount on startup, set the line `app.mount = "/mount.ogg";`.
Finally, in your Icecast config file, make sure the following settings are
accurate:
```xml
<fileserve>1</fileserve>
<webroot>./path/to/icedrop</webroot>
```
