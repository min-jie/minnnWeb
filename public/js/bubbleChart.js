/**
 * Bubble Chart 氣泡圖功能
 * 每個氣泡代表一位同學，Y軸為學生，X軸為品質指標，氣泡大小為審查參與度
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

    // 處理數據 - 使用與網路圖相同的邏輯
    const chartData = this.processDataForBubbleChart(rawData, mode);

    // 建立圖表配置 - 修正為正確的氣泡圖配置
    const config = {
      type: 'bubble',
      data: {
        datasets: [{
          label: '審查表現',
          data: chartData.bubbleData,
          backgroundColor: chartData.bubbleData.map(point => point.backgroundColor),
          borderColor: chartData.bubbleData.map(point => point.borderColor),
          borderWidth: 2
        }]
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
              text: this.getXAxisTitle(mode),
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            min: 0,
            max: 1,
            ticks: {
              stepSize: 0.1,
              callback: function(value) {
                return (value * 100).toFixed(0) + '%';
              }
            }
          },
          y: {
            type: 'linear',
            title: {
              display: true,
              text: '學生編號',
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
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                const yIndex = Math.round(context[0].parsed.y);
                const studentId = chartData.studentIds[yIndex];
                return `學號: ${studentId}`;
              },
              label: function(context) {
                const point = context.raw;
                const yIndex = Math.round(context.parsed.y);
                const studentId = chartData.studentIds[yIndex];
                return [
                  `${context.dataset.label}: ${(point.x * 100).toFixed(1)}%`,
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

  processDataForBubbleChart(rawData, mode) {
    console.log('🔄 處理氣泡圖數據...', { mode });

    // 檢查是否有 processReviewerData 函數
    if (!window.processReviewerData) {
      console.error('❌ processReviewerData 函數不存在');
      return { bubbleData: [], studentIds: [] };
    }

    // 使用與網路圖相同的數據處理邏輯
    const hwNames = Object.keys(rawData);
    const { nodes } = window.processReviewerData(rawData, mode, hwNames);

    // 節點顏色規則 (與網路圖相同)
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

    // 處理每個學生的數據
    const bubbleData = [];
    const studentIds = [];

    nodes.forEach((n, index) => {
      // 計算參與度 (與網路圖相同邏輯)
      const assignmentCount = n.feedbacks ? n.feedbacks.length : 0;
      const completedAssignments = n.feedbacks ? n.feedbacks.filter((fb) => fb !== "").length : 0;
      const participationRate = assignmentCount > 0 ? completedAssignments / assignmentCount : 0;

      // 計算分數 (與網路圖相同邏輯)
      const totalFeedbacks = n.feedbacks ? n.feedbacks.filter((fb) => fb !== "").length : 0;
      let score;

      if (mode === "all") {
        // All mode: 計算三個標籤score的平均
        if (totalFeedbacks > 0 && n.labelCounts) {
          const relevanceScore = (n.labelCounts.relevance || 0) / totalFeedbacks;
          const concretenessScore = (n.labelCounts.concreteness || 0) / totalFeedbacks;
          const constructiveScore = (n.labelCounts.constructive || 0) / totalFeedbacks;
          score = (relevanceScore + concretenessScore + constructiveScore) / 3;
        } else {
          score = 0;
        }
      } else {
        // 單一標籤模式
        if (totalFeedbacks > 0 && n.labelCounts && n.labelCounts[mode] !== undefined) {
          score = n.labelCounts[mode] / totalFeedbacks;
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

      // 計算氣泡大小 (基於參與度，與網路圖相同邏輯)
      const bubbleSize = 5 + participationRate * 15; // 5-20 的範圍

      studentIds.push(n.id);
      bubbleData.push({
        x: score, // X軸: 表現分數
        y: index, // Y軸: 學生索引 (用於定位)
        r: bubbleSize, // 氣泡大小: 參與度
        backgroundColor: color,
        borderColor: color,
        participationRate: participationRate,
        completedAssignments: completedAssignments,
        totalAssignments: assignmentCount,
        score: score,
        studentId: n.id
      });
    });

    // 按學號排序
    const sortedIndices = studentIds
      .map((id, index) => ({ id, index }))
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item, newIndex) => ({ ...item, newIndex }));

    const sortedStudentIds = sortedIndices.map(item => item.id);
    const sortedBubbleData = sortedIndices.map(item => {
      const originalData = bubbleData[item.index];
      return {
        ...originalData,
        y: item.newIndex // 更新 Y 位置
      };
    });

    console.log('✅ 氣泡圖數據處理完成:', {
      studentsCount: sortedStudentIds.length,
      mode: mode,
      sampleData: sortedBubbleData.slice(0, 3)
    });

    return {
      bubbleData: sortedBubbleData,
      studentIds: sortedStudentIds
    };
  }

  getXAxisTitle(mode) {
    const titles = {
      relevance: '相關性分數',
      concreteness: '具體性分數', 
      constructive: '建設性分數',
      all: '綜合表現分數'
    };
    return titles[mode] || '表現分數';
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
