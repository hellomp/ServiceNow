function($scope, snAttachmentHandler, i18n) {
  /* widget controller */
  var c = this;
	
	c.toggle = c.options.toggle || false;
	c.hide_control = c.options.hide_control || false;
	c.task = c.options ? c.options.task : "";
	
	$scope.scanAttachment = function(variable) {
		if (variable.state == 'not_available')
			snAttachmentHandler.showMessage('error',i18n.getMessage('Upload file scan failed').withValues([variable.display_value]));
		else
			snAttachmentHandler.scanAttachment({'sys_id' : variable.value});
	}
}