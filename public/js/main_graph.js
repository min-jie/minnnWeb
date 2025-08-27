// // Main Graph Controller for Review Engagement Analysis

// // 主要圖表控制器
// class MainGraphController {
//   constructor() {
//     this.currentData = null;
//     this.currentMode = 'all';
//     this.selectedAssignments = [];
//     this.networkInstance = null;
//     this.bubbleChartInstance = null;
//     this.initialized = false;
//   }

//   // 初始化控制器
//   init(data) {
//     console.log('🚀 初始化主圖表控制器');

//     this.currentData = data;
//     this.selectedAssignments = Object.keys(data);
//     this.initialized = true;

//     // 創建默認視圖
//     this.renderAllViews();

//     console.log('✅ 主圖表控制器初始化完成');
//   }

//   // 渲染所有視圖
//   renderAllViews() {
//     if (!this.initialized || !this.currentData) {
//       console.warn('⚠️ 控制器未初始化或沒有數據');
//       return;
//     }

//     // 渲染網絡圖
//     this.renderNetworkGraph();

//     // 渲染氣泡圖
//     this.renderBubbleChart();
//   }

//   // 渲染網絡圖
//   renderNetworkGraph() {
//     const container = document.getElementById('network-container');
//     if (!container) {
//       console.warn('⚠️ 找不到網絡圖容器');
//       return;
//     }

//     // 根據當前模式選擇適當的生成函數
//     switch(this.currentMode) {
//       case 'relevance':
//         generateRelevanceGraph(this.currentData, this.selectedAssignments);
//         break;
//       case 'concreteness':
//         generateConcretenessGraph(this.currentData, this.selectedAssignments);
//         break;
//       case 'constructive':
//         generateConstructiveGraph(this.currentData, this.selectedAssignments);
//         break;
//       default:
//         generateAllGraph(this.currentData, this.selectedAssignments);
//     }
//   }

//   // 渲染氣泡圖
//   renderBubbleChart() {
//     const canvasId = 'bubbleChart';
//     const canvas = document.getElementById(canvasId);

//     if (!canvas) {
//       console.warn('⚠️ 找不到氣泡圖畫布');
//       return;
//     }

//     // 如果氣泡圖實例存在，先銷毀
//     if (this.bubbleChartInstance) {
//       this.bubbleChartInstance.destroy();
//     }

//     // 創建新的氣泡圖實例
//     this.bubbleChartInstance = new BubbleChartManager(canvasId);

//     // 過濾數據只包含選定的作業
//     const filteredData = {};
//     this.selectedAssignments.forEach(assignment => {
//       if (this.currentData[assignment]) {
//         filteredData[assignment] = this.currentData[assignment];
//       }
//     });

//     // 初始化氣泡圖
//     this.bubbleChartInstance.init(filteredData, this.currentMode);
//   }

//   // 切換模式
//   switchMode(newMode) {
//     if (this.currentMode === newMode) return;

//     console.log(`🔄 切換模式: ${this.currentMode} → ${newMode}`);

//     this.currentMode = newMode;
//     this.renderAllViews();
//   }

//   // 更新選定的作業
//   updateSelectedAssignments(assignments) {
//     if (!Array.isArray(assignments)) {
//       console.error('❌ 作業列表必須是陣列');
//       return;
//     }

//     console.log('📝 更新選定作業:', assignments);

//     this.selectedAssignments = assignments;
//     this.renderAllViews();
//   }

//   // 更新數據
//   updateData(newData) {
//     console.log('🔄 更新圖表數據');

//     this.currentData = newData;
//     this.selectedAssignments = Object.keys(newData);
//     this.renderAllViews();
//   }

//   // 導出當前視圖
//   exportCurrentView() {
//     console.log('📸 導出當前視圖');

//     // 導出氣泡圖
//     if (this.bubbleChartInstance) {
//       this.bubbleChartInstance.exportChart();
//     }

//     // 導出網絡圖（這需要vis.js支持）
//     this.exportNetworkGraph();
//   }

//   // 導出網絡圖
//   exportNetworkGraph() {
//     const container = document.getElementById('network-container');
//     if (!container) return;

//     // 使用html2canvas或類似工具來導出網絡圖
//     // 這裡提供一個簡單的實現
//     try {
//       const canvas = document.createElement('canvas');
//       const ctx = canvas.getContext('2d');

//       // 設置畫布大小
//       canvas.width = container.offsetWidth;
//       canvas.height = container.offsetHeight;

//       // 繪製背景
//       ctx.fillStyle = '#ffffff';
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // 添加標題
//       ctx.fillStyle = '#333333';
//       ctx.font = '16px Arial';
//       ctx.textAlign = 'center';
//       ctx.fillText(`網絡圖 - ${this.currentMode} 模式`, canvas.width / 2, 30);

//       // 創建下載鏈接
//       const link = document.createElement('a');
//       link.download = `network-graph-${this.currentMode}-${Date.now()}.png`;
//       link.href = canvas.toDataURL();
//       link.click();

//     } catch (error) {
//       console.error('❌ 網絡圖導出失敗:', error);
//     }
//   }

//   // 獲取統計信息
//   getStatistics() {
//     if (!this.currentData) return null;

//     const stats = {
//       totalAssignments: Object.keys(this.currentData).length,
//       selectedAssignments: this.selectedAssignments.length,
//       totalReviews: 0,
//       averageScores: {
//         relevance: 0,
//         concreteness: 0,
//         constructive: 0
//       }
//     };

//     let totalRelevance = 0, totalConcreteness = 0, totalConstructive = 0;

//     // 計算統計數據
//     this.selectedAssignments.forEach(assignment => {
//       const assignmentData = this.currentData[assignment];
//       if (Array.isArray(assignmentData)) {
//         stats.totalReviews += assignmentData.length;

//         assignmentData.forEach(review => {
//           totalRelevance += review.relevance_score || 0;
//           totalConcreteness += review.concreteness_score || 0;
//           totalConstructive += review.constructive_score || 0;
//         });
//       }
//     });

//     // 計算平均分數
//     if (stats.totalReviews > 0) {
//       stats.averageScores.relevance = totalRelevance / stats.totalReviews;
//       stats.averageScores.concreteness = totalConcreteness / stats.totalReviews;
//       stats.averageScores.constructive = totalConstructive / stats.totalReviews;
//     }

//     return stats;
//   }

//   // 清理資源
//   destroy() {
//     console.log('🗑️ 清理主圖表控制器資源');

//     if (this.bubbleChartInstance) {
//       this.bubbleChartInstance.destroy();
//       this.bubbleChartInstance = null;
//     }

//     if (this.networkInstance) {
//       this.networkInstance.destroy();
//       this.networkInstance = null;
//     }

//     this.currentData = null;
//     this.selectedAssignments = [];
//     this.initialized = false;
//   }
// }

// // 創建全域主控制器實例
// window.mainGraphController = new MainGraphController();

// // 便利函數 - 與原有的函數接口保持兼容
// function initializeMainGraph(data) {
//   window.mainGraphController.init(data);
// }

// function updateMainGraphMode(mode) {
//   window.mainGraphController.switchMode(mode);
// }

// function updateMainGraphSelection(assignments) {
//   window.mainGraphController.updateSelectedAssignments(assignments);
// }

// function exportMainGraph() {
//   window.mainGraphController.exportCurrentView();
// }

// // 將便利函數添加到全域作用域
// window.initializeMainGraph = initializeMainGraph;
// window.updateMainGraphMode = updateMainGraphMode;
// window.updateMainGraphSelection = updateMainGraphSelection;
// window.exportMainGraph = exportMainGraph;

// import { generateAllLabelsGraph } from "./graph_func.js";
// 改為使用全域函數: window.generateAllLabelsGraph
// 注意：此檔案依賴 graph_3labelFunc.js 中的函數
// 確保 graph_3labelFunc.js 在此文件之前載入
// 函數將通過 window 全域物件取得：
// - window.generateRelevanceGraph
// - window.generateConcretenessGraph
// - window.generateConstructiveGraph
// - window.generateAllGraph

let currentMode = "all";
let rawData = null;
let currentHW = []; // 將從JSON檔案動態載入
let bubbleChartManager = null; // 新增 Bubble Chart 管理器

function updateGraphMode(mode, hwNames = [], data = null) {
  // 如果提供了數據參數，使用它；否則使用全域變數
  let useData = data || rawData;
  if (!useData) return;

  // 若傳入的是後端新格式：{ data: { model_type: "...", results: { HW1: [ ... ] } } }
  // 則將其轉換回舊的 rawData 格式：{ HW1: [ <original assignment objects> ], ... }
  if (useData && useData.data && useData.data.results) {
    try {
      const converted = {};
      const results = useData.data.results;
      Object.keys(results).forEach((hw) => {
        converted[hw] = results[hw].map((item) => {
          if (item && item.original_data && item.original_data.original) {
            return item.original_data.original;
          }
          // 若 item 本身就是原始 assignment 結構，直接回傳
          if (
            item &&
            (item.Reviewer_Name || item.Author_Name || item.Assignment)
          ) {
            return item;
          }
          // 否則回傳 item 本體（降級處理）
          return item;
        });
      });
      useData = converted;
      // 若有傳入 data 參數，更新它；同時同步覆寫全域 rawData，確保後續流程使用舊格式
      if (data) data = converted;
      rawData = converted;
    } catch (e) {
      console.warn("轉換後端新格式失敗，將嘗試以原始 useData 繼續:", e);
    }
  }

  if (!useData) return;

  // 更新全域變數（為了向後兼容）
  if (data) rawData = data;
  currentMode = mode;
  if (hwNames.length > 0) currentHW = [...hwNames];

  const targetHwNames = hwNames.length > 0 ? hwNames : currentHW;

  // 更新按鈕的 active 狀態
  console.log(`🔵 正在更新按鈕狀態，模式: ${mode}`);
  document.querySelectorAll(".switch-btn").forEach((btn, index) => {
    btn.classList.remove("active");
    console.log(`移除按鈕 ${index} 的 active 狀態`);
  });

  // 為當前模式的按鈕添加 active 類
  const modeButtons = {
    all: 0,
    relevance: 1,
    concreteness: 2,
    constructive: 3,
  };

  const buttons = document.querySelectorAll(".switch-btn");
  const targetIndex = modeButtons[mode];
  console.log(`目標按鈕索引: ${targetIndex}，總按鈕數: ${buttons.length}`);

  if (buttons[targetIndex]) {
    buttons[targetIndex].classList.add("active");
    console.log(`✅ 為按鈕 ${targetIndex} 添加 active 狀態`);
  } else {
    console.error(`❌ 找不到索引 ${targetIndex} 的按鈕`);
  }

  switch (mode) {
    case "all": {
      console.log(
        `切換到All模式 (3個標籤score平均) (${targetHwNames.join(",")})`,
      );
      if (typeof window.generateAllGraph === "function") {
        window.generateAllGraph(useData, targetHwNames);
      } else if (typeof window.generateAllLabelsGraph === "function") {
        console.warn(
          "⚠️ 找不到 generateAllGraph，改用 generateAllLabelsGraph 作為後援",
        );
        window.generateAllLabelsGraph(useData, targetHwNames);
      } else {
        console.error("❌ 沒有可用的圖表產生函式 (all)");
      }
      break;
    }
    case "relevance": {
      console.log(`切換到relevance (${targetHwNames.join(",")})`);
      if (typeof window.generateRelevanceGraph === "function") {
        window.generateRelevanceGraph(useData, targetHwNames);
      } else if (typeof window.generateAllLabelsGraph === "function") {
        console.warn(
          "⚠️ 找不到 generateRelevanceGraph，改用 generateAllLabelsGraph 作為後援",
        );
        window.generateAllLabelsGraph(useData, targetHwNames);
      } else {
        console.error("❌ 沒有可用的圖表產生函式 (relevance)");
      }
      break;
    }
    case "concreteness": {
      console.log(`切換到concreteness (${targetHwNames.join(",")})`);
      if (typeof window.generateConcretenessGraph === "function") {
        window.generateConcretenessGraph(useData, targetHwNames);
      } else if (typeof window.generateAllLabelsGraph === "function") {
        console.warn(
          "⚠️ 找不到 generateConcretenessGraph，改用 generateAllLabelsGraph 作為後援",
        );
        window.generateAllLabelsGraph(useData, targetHwNames);
      } else {
        console.error("❌ 沒有可用的圖表產生函式 (concreteness)");
      }
      break;
    }
    case "constructive": {
      console.log(`切換到constructive (${targetHwNames.join(",")})`);
      if (typeof window.generateConstructiveGraph === "function") {
        window.generateConstructiveGraph(useData, targetHwNames);
      } else if (typeof window.generateAllLabelsGraph === "function") {
        console.warn(
          "⚠️ 找不到 generateConstructiveGraph，改用 generateAllLabelsGraph 作為後援",
        );
        window.generateAllLabelsGraph(useData, targetHwNames);
      } else {
        console.error("❌ 沒有可用的圖表產生函式 (constructive)");
      }
      break;
    }
  }
  updateBubbleChartOnly(targetHwNames); // 只更新氣泡圖，不處理分析圖表
}

window.updateGraphMode = updateGraphMode;

// 注意：由於此檔案被 Vue 組件動態載入，因此註釋掉 DOMContentLoaded 事件
// Vue 組件會直接調用需要的函數
/*
document.addEventListener("DOMContentLoaded", function () {
    // 初始化作業標籤圖表按鈕事件
    initHwLabelChartEvents();
    
    // 初始化 Bubble Chart
    if (window.BubbleChartManager) {
        bubbleChartManager = new window.BubbleChartManager();
    }
    
    fetch("../function/3labeled_processed_totalData.json")
        .then(response => response.json())
        .then(data => {
            rawData = data;
            
            // 動態生成作業選項
            const hwKeys = Object.keys(data).sort(); // 獲取並排序作業列表
            console.log("📋 從JSON檔案中發現的作業:", hwKeys);
            
            // 更新全域變數
            currentHW = [...hwKeys];
            
            // 動態生成select選項
            const hwSelect = document.getElementById('hw-select');
            if (hwSelect) {
                // 清空現有選項
                hwSelect.innerHTML = '';
                
                // 添加新選項
                hwKeys.forEach(hwKey => {
                    const option = document.createElement('option');
                    option.value = hwKey;
                    option.textContent = hwKey;
                    option.selected = true; // 預設全選
                    hwSelect.appendChild(option);
                });
                
                console.log(`✅ 已動態生成 ${hwKeys.length} 個作業選項`);
            }
            
            console.log("原始資料範例：", data.HW4?.[15]);
            updateGraphMode('all', currentHW); // 初始化時傳遞 currentHW
        })
        .catch(error => {
            console.error("讀取 JSON 失敗:", error);
        });
});
*/

// 注意：以下事件處理器也被註釋掉，因為 Vue 組件會處理這些事件
/*
// GO 按鈕
document.getElementById('hw-apply-btn').addEventListener('click', () => {
    const select = document.getElementById('hw-select');
    const selectedHWs = Array.from(select.selectedOptions).map(opt => opt.value);
    if (selectedHWs.length === 0) {
        alert("請至少選擇一個作業！");
        return;
    }
    currentHW = [...selectedHWs];
    // 強制以當前模式重新生成圖表
    updateGraphMode(currentMode, currentHW);
});
*/

// 只更新氣泡圖的簡化函數
function updateBubbleChartOnly(hwNames) {
  console.log("🫧 updateBubbleChartOnly 被呼叫", hwNames);
  if (!rawData || !bubbleChartManager) return;

  try {
    console.log("只更新氣泡圖", { hwNames });

    // 準備網絡圖資料給 Bubble Chart（回傳可能是新格式或舊格式）
    const networkData = prepareNetworkDataForBubbleChart(hwNames);
    if (!networkData) return;

    // 新格式支援：{ data: { model_type: "...", results: { "HW1": [ { index, original_data, predictions, text }, ... ] } } }
    if (networkData.data && networkData.data.results) {
      const results = networkData.data.results;
      const initData = {};

      Object.keys(results).forEach((hw) => {
        // 每個 item 的 original_data.original 應包含原始 assignment 物件 (含 Reviewer_Name, Author_Name, Round ...)
        initData[hw] = results[hw].map((item) => {
          if (item && item.original_data && item.original_data.original) {
            return item.original_data.original;
          }
          // 若找不到 original，則保留原 item（降級處理）
          return item;
        });
      });

      // 使用 BubbleChartManager 的 init 介面，將轉回的 rawData 傳入
      bubbleChartManager.init(initData, currentMode);
      return;
    }

    // 若為舊格式 { nodes, edges }，直接將其設為 manager.data 並重建圖表
    if (networkData.nodes && Array.isArray(networkData.nodes)) {
      bubbleChartManager.data = networkData;
      try {
        bubbleChartManager.createChart();
      } catch (e) {
        console.warn("使用舊格式更新圖表失敗，嘗試使用 init 傳入 rawData", e);
        // fallback: 嘗試以原始 rawData 初始化（若可用）
        bubbleChartManager.init(rawData, currentMode);
      }
      return;
    }

    // 若 networkData 看起來像是 rawData 映射（hwName -> array），直接 init
    if (typeof networkData === "object") {
      bubbleChartManager.init(networkData, currentMode);
    }
  } catch (error) {
    console.error("更新氣泡圖時發生錯誤:", error);
  }
}

function updateAnalysisCharts(hwNames) {
  // 此函數已停用 - 不再處理分析圖表，因為HTML元素已被刪除
  console.log("⚠️ updateAnalysisCharts 被呼叫但已停用", hwNames);
  return;
}

// 為 Bubble Chart 準備網絡圖資料（輸出符合後端推論格式）
function prepareNetworkDataForBubbleChart(hwNames) {
  if (!rawData) return null;

  const results = {};

  hwNames.forEach((hwName) => {
    const hwData = rawData[hwName] || [];
    console.log(`處理 ${hwName}，共 ${hwData.length} 筆資料`);

    results[hwName] = hwData.map((assignment, idx) => {
      // 保留原始資料作為 original
      const original = Object.assign({}, assignment);

      // 預設 predictions 欄位
      let relevance = 0,
        concreteness = 0,
        constructive = 0;
      let relevance_confidence = 0,
        concreteness_confidence = 0,
        constructive_confidence = 0;

      if (
        assignment.Round &&
        Array.isArray(assignment.Round) &&
        assignment.Round.length > 0
      ) {
        let rCount = 0,
          cCount = 0,
          coCount = 0;
        let rSum = 0,
          cSum = 0,
          coSum = 0;

        assignment.Round.forEach((round) => {
          // 優先使用數值分數（如 0.85），若為 0/1 標記則也可累加
          if (typeof round.Relevance === "number") {
            rSum += round.Relevance;
            rCount++;
          } else if (round.Relevance === 1) {
            rSum += 1;
            rCount++;
          }

          if (typeof round.Concreteness === "number") {
            cSum += round.Concreteness;
            cCount++;
          } else if (round.Concreteness === 1) {
            cSum += 1;
            cCount++;
          }

          if (typeof round.Constructive === "number") {
            coSum += round.Constructive;
            coCount++;
          } else if (round.Constructive === 1) {
            coSum += 1;
            coCount++;
          }
        });

        const roundsLen = assignment.Round.length;
        if (rCount > 0) {
          relevance = rSum / rCount;
          relevance_confidence = rCount / roundsLen;
        }
        if (cCount > 0) {
          concreteness = cSum / cCount;
          concreteness_confidence = cCount / roundsLen;
        }
        if (coCount > 0) {
          constructive = coSum / coCount;
          constructive_confidence = coCount / roundsLen;
        }
      }

      return {
        index: idx,
        original_data: {
          comment: hwName,
          original: original,
        },
        predictions: {
          concreteness: Number(concreteness.toFixed(6)) || 0,
          concreteness_confidence:
            Number(concreteness_confidence.toFixed(6)) || 0,
          constructive: Number(constructive.toFixed(6)) || 0,
          constructive_confidence:
            Number(constructive_confidence.toFixed(6)) || 0,
          relevance: Number(relevance.toFixed(6)) || 0,
          relevance_confidence: Number(relevance_confidence.toFixed(6)) || 0,
        },
        text: hwName,
      };
    });
  });

  return {
    data: {
      model_type: "custom",
      results: results,
    },
  };
}

// 初始化全作業標籤頻率圖表按鈕事件
function initHwLabelChartEvents() {
  console.log("開始初始化全作業標籤圖表按鈕事件...");

  // 所有評論的圖表按鈕
  const generateBtn = document.getElementById("generateHwChart");
  const downloadBtn = document.getElementById("downloadHwChart");

  // 僅有效評論的圖表按鈕
  const generateValidBtn = document.getElementById("generateHwValidChart");
  const downloadValidBtn = document.getElementById("downloadHwValidChart");

  console.log("按鈕元素檢查:", {
    generateBtn: !!generateBtn,
    downloadBtn: !!downloadBtn,
    generateValidBtn: !!generateValidBtn,
    downloadValidBtn: !!downloadValidBtn,
  });

  let currentHwChart = null;
  let currentHwValidChart = null;

  // 所有評論圖表事件處理
  if (generateBtn) {
    generateBtn.addEventListener("click", async () => {
      console.log("開始生成全作業標籤頻率圖表（所有評論）...");
      generateBtn.textContent = "生成中...";
      generateBtn.disabled = true;

      try {
        currentHwChart = await generateHwLabelChart();
        if (currentHwChart) {
          console.log("圖表生成成功（所有評論）");
          downloadBtn.disabled = false;
        }
      } catch (error) {
        console.error("生成圖表失敗:", error);
        alert("生成圖表失敗，請檢查控制台錯誤信息");
      } finally {
        generateBtn.textContent = "生成圖表（所有評論）";
        generateBtn.disabled = false;
      }
    });
  }

  if (downloadBtn) {
    downloadBtn.disabled = true;
    downloadBtn.addEventListener("click", () => {
      if (currentHwChart) {
        saveChartAsPNG(currentHwChart, "hwLabelChart_all.png");
      } else {
        alert("請先生成圖表");
      }
    });
  }

  // 僅有效評論圖表事件處理
  if (generateValidBtn) {
    console.log("綁定僅有效評論圖表生成按鈕事件");
    generateValidBtn.addEventListener("click", async () => {
      console.log("點擊僅有效評論圖表生成按鈕");
      console.log("開始生成全作業標籤頻率圖表（僅有效評論）...");
      generateValidBtn.textContent = "生成中...";
      generateValidBtn.disabled = true;

      try {
        currentHwValidChart = await generateHwEnableLabelChart();
        if (currentHwValidChart) {
          console.log("圖表生成成功（僅有效評論）");
          downloadValidBtn.disabled = false;
        } else {
          console.log("圖表生成失敗：返回null");
        }
      } catch (error) {
        console.error("生成圖表失敗:", error);
        alert("生成圖表失敗，請檢查控制台錯誤信息");
      } finally {
        generateValidBtn.textContent = "生成圖表（僅有標籤）";
        generateValidBtn.disabled = false;
      }
    });
  } else {
    console.log("警告: 找不到僅有效評論圖表生成按鈕");
  }

  if (downloadValidBtn) {
    downloadValidBtn.disabled = true;
    downloadValidBtn.addEventListener("click", () => {
      if (currentHwValidChart) {
        saveChartAsPNG(currentHwValidChart, "hwLabelChart_valid.png");
      } else {
        alert("請先生成圖表");
      }
    });
  }
}

// 將函數暴露到全域
window.updateGraphMode = updateGraphMode;
