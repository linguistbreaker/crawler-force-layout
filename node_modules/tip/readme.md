tip
===

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]
[![Dependency Status][david-image]][david-url]
[npm-image]: https://img.shields.io/npm/v/tip.svg?style=flat-square
[npm-url]: https://npmjs.org/package/tip
[downloads-image]: http://img.shields.io/npm/dm/tip.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/tip
[david-image]: http://img.shields.io/david/chunpu/tip.svg?style=flat-square
[david-url]: https://david-dm.org/chunpu/tip


Simple Tip plugin

Installation
---

```sh
npm i tip
```

Usage
---

[online demo](http://chunpu.github.io/tip/browser/)

```js
var Tip = require('tip')

$(function() {
	var tip = Tip($('<div>tip</div>'))
	tip.attach('.target')
})
```

Support
---

IE6+


Api
---

```js
var tip = Tip(nodelist, options)
```


#### Options

- `stay` Boolean, if true then won't hide after mouseleave
- `offsetHook` Function, change raw offset


CSS
--

Custom style by lessc

```less
import "tip/style.less";

@tip-arrow-size: 7px; // arrow size
@tip-name: mytip; // class namespace, remember to change name in js also
```

License
---

[![License][license-image]][license-url]

[license-image]: http://img.shields.io/npm/l/tip.svg?style=flat-square
[license-url]: #
