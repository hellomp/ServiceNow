function($scope, $document, $rootScope, i18n, spScUtil) {
  /* widget controller */
  var c = this;
	var origActionName;
	
	c.getItemId = function () {
		return $scope.data.sc_cat_item ? $scope.data.sc_cat_item.sys_id : -1;
	};

	var g_form;
	$scope.$on('spModel.gForm.initialized', function(e, gFormInstance){
		if (gFormInstance.getSysId() != -1 && gFormInstance.getSysId() != c.getItemId())
			return;

		g_form = gFormInstance;
	});
	
	c.hasVariables = function(fields) {
		if (!fields) 
			return false;
		
		return Object.keys(fields).length > 0;
	}
}