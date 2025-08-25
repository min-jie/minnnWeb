// BubbleChart 調試腳本
// 在瀏覽器控制台中執行這些函數來檢測問題

// 1. 檢查BubbleChartManager是否可用
function checkBubbleChartManager() {
    console.log('=== BubbleChartManager 檢查 ===');
    console.log('BubbleChartManager存在:', typeof window.BubbleChartManager);
    
    if (window.BubbleChartManager) {
        console.log('✅ BubbleChartManager 可用');
        return true;
    } else {
        console.log('❌ BubbleChartManager 不可用');
        return false;
    }
}

// 2. 檢查Canvas元素
function checkCanvasElement() {
    console.log('=== Canvas 元素檢查 ===');
    const canvas = document.getElementById('bubbleChart');
    
    if (canvas) {
        console.log('✅ Canvas元素存在');
        console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            console.log('✅ 2D Context 可用');
            return true;
        } else {
            console.log('❌ 無法獲取2D Context');
            return false;
        }
    } else {
        console.log('❌ Canvas元素不存在');
        return false;
    }
}

// 3. 測試基本初始化
function testBasicInit() {
    console.log('=== 基本初始化測試 ===');
    
    if (!checkBubbleChartManager() || !checkCanvasElement()) {
        console.log('❌ 前置條件不滿足，跳過測試');
        return;
    }
    
    try {
        const manager = new window.BubbleChartManager('bubbleChart');
        console.log('✅ BubbleChartManager 實例創建成功');
        
        // 測試空數據初始化
        const emptyData = { nodes: [] };
        manager.data = emptyData;
        
        console.log('✅ 空數據設置成功');
        return manager;
    } catch (error) {
        console.error('❌ 基本初始化失敗:', error);
        return null;
    }
}

// 4. 測試數據處理
function testDataProcessing() {
    console.log('=== 數據處理測試 ===');
    
    const manager = testBasicInit();
    if (!manager) return;
    
    try {
        const testData = {
            "HW1": [
                {
                    "Author_Name": "D1018525",
                    "Reviewer_Name": "D1051666",
                    "Round": [
                        {
                            "feedback": "測試評論",
                            "Relevance": 0.8,
                            "Concreteness": 0.7,
                            "Constructive": 0.9
                        }
                    ]
                }
            ]
        };
        
        const processedData = manager.processData(testData);
        console.log('✅ 數據處理成功:', processedData);
        
        if (processedData && processedData.nodes && processedData.nodes.length > 0) {
            console.log('✅ 處理後數據包含節點:', processedData.nodes.length);
            return processedData;
        } else {
            console.log('⚠️ 處理後數據為空');
            return null;
        }
    } catch (error) {
        console.error('❌ 數據處理失敗:', error);
        return null;
    }
}

// 5. 完整測試流程
function runFullTest() {
    console.log('🧪 開始完整測試流程...');
    
    try {
        console.log('\n1. 檢查環境...');
        if (!checkBubbleChartManager() || !checkCanvasElement()) {
            throw new Error('環境檢查失敗');
        }
        
        console.log('\n2. 測試數據處理...');
        const processedData = testDataProcessing();
        if (!processedData) {
            throw new Error('數據處理測試失敗');
        }
        
        console.log('\n3. 測試完整初始化...');
        const manager = new window.BubbleChartManager('bubbleChart');
        
        const testData = {
            "HW1": [
                {
                    "Author_Name": "D1018525",
                    "Reviewer_Name": "D1051666",
                    "Round": [
                        {
                            "feedback": "測試評論",
                            "Relevance": 0.8,
                            "Concreteness": 0.7,
                            "Constructive": 0.9
                        }
                    ]
                }
            ]
        };
        
        // 分步驟初始化避免循環調用
        console.log('   3.1 處理數據...');
        manager.data = manager.processData(testData);
        
        console.log('   3.2 初始化圖表...');
        manager.initChart();
        
        console.log('   3.3 更新圖表...');
        manager.updateChart();
        
        console.log('🎉 完整測試成功！');
        return manager;
        
    } catch (error) {
        console.error('❌ 完整測試失敗:', error);
        return null;
    }
}

// 使用說明
console.log(`
BubbleChart 調試腳本已載入！

使用方法：
1. checkBubbleChartManager() - 檢查BubbleChartManager是否可用
2. checkCanvasElement() - 檢查Canvas元素
3. testBasicInit() - 測試基本初始化
4. testDataProcessing() - 測試數據處理
5. runFullTest() - 運行完整測試

建議執行順序：runFullTest()
`);

// 自動運行基本檢查
setTimeout(() => {
    checkBubbleChartManager();
    checkCanvasElement();
}, 1000);
