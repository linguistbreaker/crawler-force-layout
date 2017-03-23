var Tip = require('../')

$(function() {
	var basicTip = Tip('<div>tip1</div>', {
		stay: true,
		style: 'basic'
	})
	basicTip.attach('[data-type="basic"]')

	var borderTip = Tip('<div>tip2</div>', {
		stay: true,
		style: 'border'
	})
	borderTip.attach('[data-type="border"]')
})
