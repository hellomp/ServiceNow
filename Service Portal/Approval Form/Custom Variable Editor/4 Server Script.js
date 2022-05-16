(function () {
  data.table = options.table || $sp.getParameter("table");
  data.sys_id =
    options.sys_id ||
    $sp.getParameter("sys_id") ||
    $sp.getParameter("sl_sys_id");
  data.msg = gs.getMessage("There are no variables associated");
  data.hide_container = options.hide_container;
  if (input) {
    var vars = [];
    var fields = input.sc_cat_item._fields;
    data.sys_id = input.sys_id;
    data.table = input.table;
    if (!data.table || !data.sys_id) return;

    var values = getValues(data.table, data.sys_id);
    for (var v in fields) {
      // 12: Break, 19: Container Start, 20: Container End, 24: Container Split
      if (
        values[f].type == 12 ||
        values[f].type == 19 ||
        values[f].type == 20 ||
        values[f].type == 24
      )
        continue;
      vars.push(fields[v]);
    }

    if (data.table == "sc_cart_item") SPCart.updateItem(input.sys_id, vars);
    else $sp.saveVariables(input.table, input.sys_id, vars);
    return;
  }

  if (!data.table || !data.sys_id) {
    return;
  }

  var gr = $sp.getRecord(data.table, data.sys_id);
  if (gr.isValid() && gr.canRead()) {
    var targetTable = data.table;
    if (targetTable == "sc_cart_item") targetTable = "sc_cat_item";
    var req_id = "";
    var task_id = "";
    var sys_id = "";
    var table_id = "";
    var opened_by = "";
    if (data.table == "sc_task") {
      req_id = gr.request_item.getValue();
      task_id = data.sys_id;
      sys_id = gr.request_item.cat_item.getValue();
      opened_by = gr.opened_by.getValue();
    } else if (data.table == "sc_req_item") {
      req_id = data.sys_id;
      sys_id = gr.cat_item.getValue();
      opened_by = gr.opened_by.getValue();
    } else if (data.table == "sc_cart_item") {
      sys_id = gr.cat_item.getValue();
      req_id = gr.getUniqueValue();
    } else if (gr.instanceOf("task")) {
      targetTable = data.table;
      table_id = data.sys_id;
      opened_by = gr.opened_by.getValue();
      var catItemProducedGr = new GlideRecord("sc_item_produced_record");
      catItemProducedGr.addQuery("record_key", data.sys_id);
      catItemProducedGr.query();
      if (catItemProducedGr.next())
        sys_id = catItemProducedGr.getValue("producer");
    } else {
      sys_id = gr.request_item.cat_item.getValue();
    }
    var filter = {
      sys_id: String(sys_id),
      request_id: String(req_id),
      task_id: String(task_id),
      table: String(targetTable),
      table_id: String(table_id),
      opened_by: String(opened_by),
    };
    data.sc_cat_item = $sp.getCatalogItem(filter);

    if (options.showItemTitle)
      data.itemTitle = data.sc_cat_item.short_description;
    var values = {};
    if (
      data.table == "sc_task" ||
      data.table == "sc_req_item" ||
      data.table == "sc_cart_item"
    ) {
      values = getValues(data.table, req_id, task_id, opened_by);
    } else {
      // Other task extensions
      values = getValuesForProducer(data.table, data.sys_id, opened_by);
    }
    data.values = values;
    for (var f in data.sc_cat_item._fields) {
      if (options.readonly_variable_editor == "true" || !gr.canWrite())
        data.sc_cat_item._fields[f].readonly = true;

      //	Adding table_name for attachment variables
      if (data.sc_cat_item._fields[f].type == "sc_attachment") {
        data.sc_cat_item._fields[f].recordTableName = data.table;
        data.sc_cat_item._fields[f].recordSysId = data.sys_id;
      }

      // Put the values into the cat item fields
      if (typeof values[f] != "undefined") {
        if (
          values[f].type == 12 ||
          values[f].type == 19 ||
          values[f].type == 20 ||
          values[f].type == 24
        )
          continue;
        if (typeof values[f].value != "undefined") {
          if (values[f].type == 9 || values[f].type == 10)
            data.sc_cat_item._fields[f].value = values[f].displayValue;
          else if (
            values[f].type == 25 &&
            data.sc_cat_item._fields[f].catalog_view_masked
          )
            data.sc_cat_item._fields[f].value = values[f].decrypted_value;
          else data.sc_cat_item._fields[f].value = values[f].value;
          data.sc_cat_item._fields[f].displayValue = values[f].displayValue;
          data.sc_cat_item._fields[f].display_value_list =
            values[f].display_value_list;
        }
      }
    }
  } else
    data.msg = gs.getMessage(
      "You are either not authorized or record is not valid"
    );

  function getValues(table, sys_id, task_id, opened_by) {
    var qs = new GlideappVariablePoolQuestionSet();
    if (table == "sc_cart_item") qs.setCartID(sys_id);
    else if (table == "sc_task") {
      qs.setRequestID(sys_id);
      qs.setTaskID(task_id);
    } else {
      qs.setRequestID(sys_id);
    }

    qs.load();
    var values = {};
    var questions = qs.getFlatQuestions().toArray();
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var o = {
        value: q.getValue(),
        displayValue: q.getDisplayValue(),
        type: q.getType(),
      };
      //handling List Collector (21) and Masked (25) variables.
      if (o.type == 21) o.display_value_list = q.getDisplayValues().toArray();
      if (o.type == 25 && q.canDecrypt(opened_by, table))
        o.decrypted_value = q.decrypt(o.value);
      var qKey = q.getName();
      if (typeof qKey == "undefined" || qKey == "") qKey = "IO:" + q.getId();
      values[qKey] = o;
    }
    return values;
  }

  function getValuesForProducer(table, sys_id, opened_by) {
    var qs = new GlideappSequencedQuestionSet();
    qs.setTableName(table);
    qs.setTableSysID(sys_id);

    qs.load();
    var values = {};
    var questions = qs.getFlatQuestions().toArray();
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      var o = {
        value: q.getValue(),
        displayValue: q.getDisplayValue(),
        type: q.getType(),
      };
      //handling List Collector (21) and Masked (25) variables.
      if (o.type == 21) o.display_value_list = q.getDisplayValues().toArray();
      if (o.type == 25 && q.canDecrypt(opened_by, table))
        o.decrypted_value = q.decrypt(o.value);
      var qKey = q.getName();
      if (typeof qKey == "undefined" || qKey == "") qKey = "IO:" + q.getId();
      values[qKey] = o;
    }
    return values;
  }
})();
