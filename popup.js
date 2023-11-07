document.addEventListener('DOMContentLoaded', function() {
    const grabAndDownloadButton = document.getElementById('grabAndDownloadButton');
  
    grabAndDownloadButton.addEventListener('click', function() {
      // 查询当前选项卡的标签页
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentTab = tabs[0];
  
        // 向当前选项卡发送消息以抓取表格内容
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            function: scrapeTable
          },
          function(results) {
            const tableData = results[0].result;
  
            // 转换为CSV格式
            const csvData = convertTableToCSV(tableData);
  
            // 使用chrome.downloads API保存为CSV文件
            chrome.downloads.download({
              url: URL.createObjectURL(new Blob([csvData], { type: 'text/csv' })),
              filename: 'table_data.csv',
              saveAs: true
            });
          }
        );
      });
    });
  });
  
  // 从页面中抓取表格内容
  function scrapeTable() {
    const table = document.querySelectorAll('#formContent > table.form_table')[1];
    const csvData = [];
    if (table) {
      const rows = table.querySelectorAll('tr');
      const headerMapping = [
        ['申请日期', '发起时间'],
        ['单据编号', 'OA单号'],
        ['*报销部门', '报销部门'],
        ['结算方式', 'OA类型'],
        ['申请人', '申请人'],
        ['*报销人', '报销人/收款公司'],
        ['*费用类别', '费用类别'],
        ['*报销事由', '报销事由']
      ];
  
      const newHeader = headerMapping.map(entry => entry[1]);
      csvData.push(newHeader.join(','));
  
      const rowData = [];
      for (let i = 0; i < headerMapping.length; i++) {
        const targetHeader = headerMapping[i][0];
        for (const row of rows) {
          const cells = row.querySelectorAll('td, th');
  
          if (cells[0].textContent.trim() === targetHeader) {
            rowData.push(cells[1].textContent.trim());
            break;
          }
        }
      }
      if (rowData.length > 0) {
        csvData.push(rowData.join(','));
      }
      /*
      // 申请日期 -> 发起时间
      // 单据编号 -> OA单号
      // *报销部门 -> 报销部门
      // table2 成本中心描述 -> 产品(成本归属)
      // 结算方式 选择框 -> OA类型
      // 申请人 -> 申请人
      // *报销人 -> 报销人/收款公司
      // *费用类别 -> 费用类别
      // table3 申请报销：XX.XX 元 -> 金额
      // ？ -> 核算类别
      // *报销事由 -> 报销事由 
      */
    }
    return csvData;
  }
  
  // 将表格数据转换为CSV格式
  function convertTableToCSV(tableData) {
    return tableData.join('\n');
  }
  