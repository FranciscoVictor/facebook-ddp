#facebook-ddp

Modification of meteor's [facebook](https://github.com/meteor/meteor/tree/devel/packages/facebook) package so that mobile DDP clients can log in with OAuth.

This version is based on [jasper-lu](github.com/jasper-lu)'s work but with slight modifications to allow the request of the logged user's information

In case you are already using meteor's accounts-facebook, first remove it using:

    meteor remove accounts-facebook

Then add this package by using:

    meteor add franciscovictor:accounts-facebook-ddp

This package work in pair with [accounts-facebook-ddp](github.com/FranciscoVictor/accounts-facebook-ddp), so you only need to add one, as shown above.
