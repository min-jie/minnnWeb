/**
 * Bubble Chart 氣泡圖功能
 * 每個學生在四個品質指標位置各有一個氣泡
 * Y軸按審查參與度排序，參與度越高位置越高
 */

class BubbleChartManager {
  constructor(canvasId = 'bubbleChart') {
    this.canvasId = canvasId;
    this.chart = null;
    this.canvas = null;
    this.ctx = null;
  }

  init(rawData, mode = 'all') {
    console.log('🫧 初始化氣泡圖...', { mode, dataKeys: Object.keys(rawData || {}) });
    
    if (!rawData || Object.keys(rawData).length === 0) {
      console.warn('⚠️ 無數據可顯示氣泡圖');
      return;
    }

    this.createChart(rawData, mode);
  }

  updateData(data, mode = 'all') {
    console.log('🔄 更新氣泡圖數據...', { mode });
    this.init(data, mode);
  }

  createChart(rawData, mode) {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with id "${this.canvasId}" not found`);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Cannot get 2D context from canvas');
    }

    // 清除現有圖表
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // 處理數據 - 生成四個品質指標的數據
    const chartData = this.processDataForBubbleChart(rawData);

    // 建立圖表配置 - 四個品質指標排列在不同 X 位置
    const config = {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: '相關性',
            data: chartData.relevanceData,
            backgroundColor: chartData.relevanceData.map(point => point.backgroundColor),
            borderColor: chartData.relevanceData.map(point => point.borderColor),
            borderWidth: 2
          },
          {
            label: '具體性',
            data: chartData.concretenessData,
            backgroundColor: chartData.concretenessData.map(point => point.backgroundColor),
            borderColor: chartData.concretenessData.map(point => point.borderColor),
            borderWidth: 2
          },
          {
            label: '建設性',
            data: chartData.constructiveData,
            backgroundColor: chartData.constructiveData.map(point => point.backgroundColor),
            borderColor: chartData.constructiveData.map(point => point.borderColor),
            borderWidth: 2
          },
          {
            label: '綜合',
            data: chartData.allData,
            backgroundColor: chartData.allData.map(point => point.backgroundColor),
            borderColor: chartData.allData.map(point => point.borderColor),
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: '品質指標',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: -0.5,
            max: 3.5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const labels = ['相關性', '具體性', '建設性', '綜合'];
                const roundedValue = Math.round(value);
                if (roundedValue >= 0 && roundedValue < labels.length) {
                  return labels[roundedValue];
                }
                return '';
              }
            },
            grid: {
              display: true,
              drawTicks: true
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: '學號 (依審查參與度排序)',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: -0.5,
            max: chartData.studentIds.length - 0.5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const index = Math.round(value);
                return chartData.studentIds[index] || '';
              },
              font: {
                size: 10
              }
            },
            grid: {
              display: true,
              drawTicks: true
            }
          }
        },
        plugins: {
          legend: {
            display: false, // 隱藏圖例，X軸已經顯示品質指標
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const point = context[0].raw;
                return `學號: ${point.studentId}`;
              },
              label: function(context) {
                const point = context.raw;
                const datasetLabel = context.dataset.label;
                
                // 只顯示當前品質指標的相關信息
                return [
                  `${datasetLabel}: ${(point.score * 100).toFixed(1)}%`,
                  `審查參與度: ${(point.participationRate * 100).toFixed(1)}%`,
                  `完成作業數: ${point.completedAssignments}/${point.totalAssignments}`
                ];
              }
            }
          }
        }
      }
    };

    // 建立圖表
    this.chart = new Chart(this.ctx, config);
    console.log('✅ 氣泡圖建立完成');
  }

  processDataForBubbleChart(rawData) {
    console.log('🔄 處理氣泡圖數據...');

    // 檢查是否有 processReviewerData 函數
    if (!window.processReviewerData) {
      console.error('❌ processReviewerData 函數不存在');
      return { 
        relevanceData: [], 
        concretenessData: [], 
        constructiveData: [], 
        allData: [], 
        studentIds: [] 
      };
    }

    const hwNames = Object.keys(rawData);
    
    // 節點顏色規則
    const colorConfig = {
      relevance: {
        colors: ["#FFEEB7", "#FFD753", "#F1BC0D", "#D4A302"],
        title: "相關性分數",
      },
      concreteness: {
        colors: ["#CFFFCA", "#95ED65", "#54AF23", "#327111"],
        title: "具體性分數",
      },
      constructive: {
        colors: ["#F1DCFF", "#C78EED", "#9444CA", "#590A8E"],
        title: "建設性分數",
      },
      all: {
        colors: ["#F0F0F0", "#E0E0E0", "#757575", "#424242"],
        title: "綜合表現分數",
      },
    };

    // X 軸位置對應 (0=相關性, 1=具體性, 2=建設性, 3=綜合)
    const xPositions = {
      'relevance': 0,
      'concreteness': 1,
      'constructive': 2,
      'all': 3
    };

    // 首先獲取所有學生列表（從 'all' 模式獲取完整的學生列表）
    const { nodes: allNodes } = window.processReviewerData(rawData, 'all', hwNames);
    
    // 計算每個學生的審查參與度並排序
    const studentsWithParticipation = allNodes.map(n => {
      const assignmentCount = n.feedbacks ? n.feedbacks.length : 0;
      const completedAssignments = n.feedbacks ? n.feedbacks.filter((fb) => fb !== "").length : 0;
      const participationRate = assignmentCount > 0 ? completedAssignments / assignmentCount : 0;
      
      return {
        id: n.id,
        participationRate: participationRate,
        assignmentCount: assignmentCount,
        completedAssignments: completedAssignments
      };
    });

    // 按審查參與度排序（高到低）
    // 如果參與度相同，再按學號排序
    studentsWithParticipation.sort((a, b) => {
      if (Math.abs(a.participationRate - b.participationRate) < 0.001) {
        // 參與度相同時，按學號排序
        return a.id.localeCompare(b.id);
      }
      // 參與度高的排在前面（Y軸值越大，顯示位置越高）
      return b.participationRate - a.participationRate;
    });

    const sortedStudentIds = studentsWithParticipation.map(s => s.id);
    
    console.log('學生列表 (按參與度排序):', studentsWithParticipation.map(s => ({
      id: s.id,
      participationRate: (s.participationRate * 100).toFixed(1) + '%'
    })));

    // 為每個模式獲取數據
    const modes = ['relevance', 'concreteness', 'constructive', 'all'];
    const modeData = {};
    
    modes.forEach(mode => {
      const { nodes } = window.processReviewerData(rawData, mode, hwNames);
      // 將節點數據轉為以學號為 key 的對象，便於查找
      modeData[mode] = {};
      nodes.forEach(n => {
        modeData[mode][n.id] = n;
      });
    });

    // 為每個品質指標創建數據集
    const datasets = {
      relevanceData: [],
      concretenessData: [],
      constructiveData: [],
      allData: []
    };

    // 為每個學生在每個品質指標位置創建氣泡
    // Y軸索引從0開始，但在圖表中會反轉顯示（索引0顯示在底部，索引大顯示在頂部）
    sortedStudentIds.forEach((studentId, sortedIndex) => {
      // 計算 Y 軸位置：讓參與度最高的學生顯示在最上方
      const yIndex = sortedStudentIds.length - 1 - sortedIndex;
      
      modes.forEach((mode) => {
        const studentNode = modeData[mode][studentId];
        
        // 如果該學生在該模式下沒有數據，創建默認數據
        if (!studentNode) {
          const defaultBubble = {
            x: xPositions[mode], // X軸: 品質指標位置
            y: yIndex, // Y軸: 學生索引 (反轉後參與度高的在上方)
            r: 2, // 最小氣泡大小
            backgroundColor: colorConfig[mode].colors[0],
            borderColor: colorConfig[mode].colors[0],
            participationRate: 0,
            completedAssignments: 0,
            totalAssignments: 0,
            score: 0,
            studentId: studentId
          };
          
          datasets[mode + 'Data'].push(defaultBubble);
          return;
        }

        // 計算參與度 (與網路圖相同邏輯)
        const assignmentCount = studentNode.feedbacks ? studentNode.feedbacks.length : 0;
        const completedAssignments = studentNode.feedbacks ? studentNode.feedbacks.filter((fb) => fb !== "").length : 0;
        const participationRate = assignmentCount > 0 ? completedAssignments / assignmentCount : 0;

        // 計算分數 (與網路圖相同邏輯)
        const totalFeedbacks = studentNode.feedbacks ? studentNode.feedbacks.filter((fb) => fb !== "").length : 0;
        let score;

        if (mode === "all") {
          // All mode: 計算三個標籤score的平均
          if (totalFeedbacks > 0 && studentNode.labelCounts) {
            const relevanceScore = (studentNode.labelCounts.relevance || 0) / totalFeedbacks;
            const concretenessScore = (studentNode.labelCounts.concreteness || 0) / totalFeedbacks;
            const constructiveScore = (studentNode.labelCounts.constructive || 0) / totalFeedbacks;
            score = (relevanceScore + concretenessScore + constructiveScore) / 3;
          } else {
            score = 0;
          }
        } else {
          // 單一標籤模式
          if (totalFeedbacks > 0 && studentNode.labelCounts && studentNode.labelCounts[mode] !== undefined) {
            score = studentNode.labelCounts[mode] / totalFeedbacks;
          } else {
            score = 0;
          }
        }

        // 計算顏色 (與網路圖相同的4分級邏輯)
        let color;
        if (score >= 0.75) color = colorConfig[mode].colors[3]; // 最深色 (75%以上)
        else if (score >= 0.5) color = colorConfig[mode].colors[2]; // 深色 (50-75%)
        else if (score >= 0.25) color = colorConfig[mode].colors[1]; // 淺色 (25-50%)
        else color = colorConfig[mode].colors[0]; // 最淺色 (25%以下)

        // 計算氣泡大小 (基於參與度，讓參與度高的氣泡更大)
        const bubbleSize = 3 + participationRate * 10; // 3-13 的範圍，基於參與度

        const bubble = {
          x: xPositions[mode], // X軸: 品質指標位置 (0, 1, 2, 3)
          y: yIndex, // Y軸: 學生索引 (反轉後參與度高的在上方)
          r: bubbleSize, // 氣泡大小: 基於參與度
          backgroundColor: color,
          borderColor: color,
          participationRate: participationRate,
          completedAssignments: completedAssignments,
          totalAssignments: assignmentCount,
          score: score,
          studentId: studentId
        };

        datasets[mode + 'Data'].push(bubble);
      });
    });

    const totalBubbles = Object.values(datasets).reduce((sum, data) => sum + data.length, 0);
    const expectedBubbles = sortedStudentIds.length * 4;

    // 準備 Y 軸學號標籤（反轉順序，讓參與度高的顯示在上方）
    const reversedStudentIds = [...sortedStudentIds].reverse();

    console.log('✅ 氣泡圖數據處理完成:', {
      studentsCount: sortedStudentIds.length,
      modesProcessed: modes.length,
      totalBubbles: totalBubbles,
      expectedBubbles: expectedBubbles,
      isCorrect: totalBubbles === expectedBubbles,
      topStudents: studentsWithParticipation.slice(0, 3).map(s => ({
        id: s.id,
        participationRate: (s.participationRate * 100).toFixed(1) + '%',
        note: '顯示在圖表頂部'
      }))
    });

    return {
      relevanceData: datasets.relevanceData,
      concretenessData: datasets.concretenessData,
      constructiveData: datasets.constructiveData,
      allData: datasets.allData,
      studentIds: reversedStudentIds // 反轉順序用於 Y 軸標籤
    };
  }

  // 匯出功能
  exportChart(filename = 'bubble-chart.png') {
    if (!this.canvas) {
      console.error('Canvas not found');
      return;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL();
    link.click();
  }
}

// 暴露到全域
window.BubbleChartManager = BubbleChartManager;
