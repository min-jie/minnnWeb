/**
 * Bubble Chart 氣泡圖功能
 * 每個氣泡代表一位同學，Y軸為學生，X軸為品質指標，氣泡大小為審查參與度
 */

class BubbleChartManager {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.chart = null;
        this.data = null;
        this.currentMode = 'all';
        this.isInitializing = false;
        this.studentNames = []; // 本地存儲學生名稱
    }

    init(rawData, mode = 'all') {
        // 防止重複初始化導致的無限遞迴
        if (this.isInitializing) {
            console.warn('⚠️ BubbleChart 正在初始化中，跳過重複調用');
            return;
        }
        
        try {
            this.isInitializing = true;
            console.log('🔄 BubbleChart 初始化開始...', { dataKeys: Object.keys(rawData), mode });
            
            // 銷毀舊圖表
            if (this.chart) {
                try {
                    this.chart.destroy();
                } catch (e) {
                    console.warn('銷毀舊圖表失敗:', e);
                }
                this.chart = null;
            }
            
            // 處理數據
            this.data = this.processData(rawData);
            this.currentMode = mode;
            
            // 檢查處理後的數據
            if (!this.data || !this.data.nodes || this.data.nodes.length === 0) {
                console.warn('⚠️ BubbleChart 數據為空，跳過初始化');
                return;
            }
            
            console.log('📊 處理後的數據:', {
                nodeCount: this.data.nodes.length,
                studentNodes: this.data.nodes.filter(n => n.group === 'student').length
            });
            
            // 重新創建圖表
            this.createChart();
            
            console.log('✅ BubbleChart 初始化完成');
        } catch (error) {
            console.error('❌ BubbleChart 初始化失敗:', error);
            // 嘗試顯示錯誤信息而不是崩潰
            this.showErrorMessage('初始化失敗');
        } finally {
            this.isInitializing = false;
        }
    }

    showErrorMessage(message) {
        const canvas = document.getElementById(this.canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ff6b6b';
            ctx.textAlign = 'center';
            ctx.fillText(`氣泡圖${message}`, canvas.width / 2, canvas.height / 2);
        }
    }

    createChart() {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            throw new Error(`Canvas element with id "${this.canvasId}" not found`);
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('無法獲取Canvas 2D context');
        }

        // 準備學生數據
        const students = this.extractStudentData();
        this.studentNames = students.map(s => s.name);
        
        // 計算Y軸範圍
        const yAxisMax = Math.max(students.length - 0.5, 1.5);
        const yAxisMin = -0.5;
        
        console.log(`設置Y軸範圍: ${yAxisMin} 到 ${yAxisMax} (學生數: ${students.length})`);

        // 準備氣泡數據
        const bubbleData = this.prepareBubbleData();
        
        // 創建最簡化的Chart.js配置
        const config = this.createMinimalChartConfig(yAxisMin, yAxisMax, bubbleData);
        
        // 創建圖表
        this.chart = new Chart(ctx, config);
        
        console.log('✅ 圖表創建完成');
    }

    createMinimalChartConfig(yAxisMin, yAxisMax, bubbleData) {
        // 為四個品質指標創建數據集
        const datasets = [
            {
                label: '相關性',
                data: bubbleData.filter(d => d.labelType === 0),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            },
            {
                label: '具體性',
                data: bubbleData.filter(d => d.labelType === 1),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            },
            {
                label: '建設性',
                data: bubbleData.filter(d => d.labelType === 2),
                backgroundColor: 'rgba(255, 206, 86, 0.6)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 2
            },
            {
                label: '總和',
                data: bubbleData.filter(d => d.labelType === 3),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }
        ];

        return {
            type: 'bubble',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '全班作業審查狀況多維氣泡圖'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: { display: true, text: '品質指標' },
                        min: -0.5,
                        max: 3.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const labels = ['相關性', '具體性', '建設性', '總和'];
                                const roundedValue = Math.round(value);
                                return (roundedValue >= 0 && roundedValue < labels.length) ? labels[roundedValue] : '';
                            }
                        }
                    },
                    y: {
                        display: true,
                        title: { display: true, text: '學生' },
                        min: yAxisMin,
                        max: yAxisMax,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const roundedValue = Math.round(value);
                                return (roundedValue >= 0 && roundedValue < 50) ? `S${roundedValue + 1}` : '';
                            }
                        }
                    }
                }
            }
        };
    }

    // 空的更新方法，避免調用
    updateChart() {
        console.log('⚠️ updateChart 被調用但已禁用，避免循環引用');
    }

    prepareBubbleData() {
        const students = this.extractStudentData();
        const bubbleData = [];

        console.log(`準備氣泡圖資料：共 ${students.length} 位學生`);

        // 為每個學生創建氣泡
        students.forEach((student, studentIndex) => {
            // 為四個品質指標創建氣泡
            for (let labelType = 0; labelType < 4; labelType++) {
                let labelRatio = 0;
                
                // 計算標籤比例
                if (labelType === 3) { // 總和模式
                    labelRatio = student.averageLabelRatio;
                } else {
                    const labelCounts = [student.relevanceCount, student.concretenessCount, student.constructiveCount];
                    labelRatio = labelCounts[labelType] / Math.max(student.validComments, 1);
                }
                
                // 氣泡大小
                const bubbleSize = Math.max(student.reviewCompletionRate * 15 + 3, 3);
                
                bubbleData.push({
                    x: labelType,
                    y: studentIndex,
                    r: bubbleSize,
                    studentName: student.name,
                    labelType: labelType,
                    labelRatio: labelRatio,
                    reviewCompletionRate: student.reviewCompletionRate,
                    validComments: student.validComments,
                    assignedTasks: student.assignedTasks
                });
            }
        });
        
        console.log(`氣泡圖資料準備完成，共 ${bubbleData.length} 個氣泡`);
        return bubbleData;
    }

    extractStudentData() {
        if (!this.data || !this.data.nodes) {
            return [];
        }

        const students = [];
        this.data.nodes.forEach(node => {
            if (node.group === 'student') {
                const reviewCompletionRate = (node.validComments || 0) / Math.max(node.assignedTasks || 1, 1);
                const validRoundsCount = Math.max((node.validRounds || node.validComments || 0), 1);
                const relevanceRatio = (node.relevanceCount || 0) / validRoundsCount;
                const concretenessRatio = (node.concretenessCount || 0) / validRoundsCount;
                const constructiveRatio = (node.constructiveCount || 0) / validRoundsCount;
                const averageLabelRatio = (relevanceRatio + concretenessRatio + constructiveRatio) / 3;
                
                students.push({
                    id: node.id,
                    name: node.label,
                    validComments: node.validComments || 0,
                    validRounds: node.validRounds || 0,
                    assignedTasks: node.assignedTasks || 0,
                    relevanceCount: node.relevanceCount || 0,
                    concretenessCount: node.concretenessCount || 0,
                    constructiveCount: node.constructiveCount || 0,
                    reviewCompletionRate: reviewCompletionRate,
                    averageLabelRatio: averageLabelRatio
                });
            }
        });

        // 按審查參與度排序
        students.sort((a, b) => b.reviewCompletionRate - a.reviewCompletionRate);
        return students;
    }

    processData(rawData) {
        const students = new Map();
        
        console.log('🔄 處理原始數據:', Object.keys(rawData));
        
        Object.keys(rawData).forEach(hwName => {
            const hwData = rawData[hwName];
            if (!hwData || !Array.isArray(hwData)) return;
            
            hwData.forEach((entry) => {
                const reviewerName = entry.Reviewer_Name;
                if (!reviewerName) return;
                
                if (!students.has(reviewerName)) {
                    students.set(reviewerName, {
                        id: reviewerName,
                        name: reviewerName,
                        validComments: 0,
                        validRounds: 0,
                        assignedTasks: 0,
                        relevanceCount: 0,
                        concretenessCount: 0,
                        constructiveCount: 0
                    });
                }
                
                const student = students.get(reviewerName);
                student.assignedTasks += 1;
                
                if (entry.Round && Array.isArray(entry.Round)) {
                    entry.Round.forEach(round => {
                        if (round.feedback && round.feedback.trim() !== '') {
                            student.validComments += 1;
                            student.validRounds += 1;
                            
                            if (round.Relevance > 0) student.relevanceCount += round.Relevance;
                            if (round.Concreteness > 0) student.concretenessCount += round.Concreteness;
                            if (round.Constructive > 0) student.constructiveCount += round.Constructive;
                        }
                    });
                }
            });
        });
        
        const result = {
            nodes: Array.from(students.values()).map(student => ({
                ...student,
                group: 'student',
                label: student.name
            }))
        };
        
        console.log(`✅ 數據處理完成，共 ${result.nodes.length} 位學生`);
        return result;
    }
}


// 匯出供其他模組使用
window.BubbleChartManager = BubbleChartManager;
