(function () {
  data.label = options.label || gs.getMessage("Options");
  if (options.task)
    data.ariaLabel = gs.getMessage("{0} for {1}", [data.label, options.task]);
  else data.ariaLabel = data.label;
  if (options.variables) {
    var itemVariables = options.variables;
    if (options.item) {
      data.variables = [];
      var checkboxes = {
        display_value: [],
        label: "Opções selecionadas",
        multi_row: false,
        type: 7,
        value: "true",
        visible_summary: true,
      };
      for (var i in itemVariables) {
        if (
          itemVariables[i].type === "7" ||
          (itemVariables[i].type === 7 &&
            (itemVariables[i].value == "true" ||
              itemVariables[i].value == true))
        ) {
          checkboxes.display_value.push(itemVariables[i].label);
        } else if (
          itemVariables[i].type !== "7" &&
          itemVariables[i].type !== 7
        ) {
          data.variables.push(itemVariables[i]);
        }
      }
      if (checkboxes.display_value.length) {
        checkboxes.display_value = checkboxes.display_value.join("\n");
        data.variables.push(checkboxes);
      }
    } else {
      data.variables = itemVariables;
    }
  }

  var tableName = options.table || $sp.getParameter("table");
  var sysId = options.sys_id || $sp.getParameter("sys_id");
  var record = sn_std_tkt_api.TicketConfig.getTicketRecord(tableName, sysId);

  if (record == null) return;

  data.canRead = record.canRead();
  if (!data.canRead) return;

  data.variables = new GlobalServiceCatalogUtil().getVariablesForTask(
    record,
    true
  );
})();
