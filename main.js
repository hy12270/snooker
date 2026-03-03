import { BallManager } from './ballManager.js';
import { PathCalculator } from './pathCalculator.js';
import { CanvasRenderer } from './canvasRenderer.js';

class SnookerGame {
    constructor() {
        this.canvas = document.getElementById('snookerTable');
        this.ctx = this.canvas.getContext('2d');
        this.whiteBall = document.getElementById('whiteBall');
        this.redBall = document.getElementById('redBall');
        
        // 传入回调函数，当球位置改变时重绘canvas
        this.ballManager = new BallManager(this.whiteBall, this.redBall, this.canvas, () => {
            this.onBallPositionChanged();
        });
        this.pathCalculator = new PathCalculator();
        this.renderer = new CanvasRenderer(this.canvas, this.ctx);
        
        this.initEventListeners();
        this.initCanvas();
        
        // 立即设置球的位置
        this.resetBalls();
    }
    
    initCanvas() {
        // 等待容器完全渲染后再初始化
        setTimeout(() => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            const pixelRatio = window.devicePixelRatio || 1;
            
            // 使用统一的渲染器接口设置尺寸和DPI缩放
            this.renderer.setSize(rect.width, rect.height, pixelRatio);
            
            // 立即绘制球桌和标记点
            this.renderer.drawTable(this.getShowGrid());
        }, 100);
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            const container = this.canvas.parentElement;
            const newRect = container.getBoundingClientRect();
            const oldSize = this.renderer.getDisplaySize();
            const oldWidth = oldSize.width;
            const oldHeight = oldSize.height;
            
            const newPixelRatio = window.devicePixelRatio || 1;
            
            // 更新canvas尺寸（统一通过renderer）
            this.renderer.setSize(newRect.width, newRect.height, newPixelRatio);
            
            // 按比例调整球的位置
            if (oldWidth > 0 && oldHeight > 0) {
                const scaleX = newRect.width / oldWidth;
                const scaleY = newRect.height / oldHeight;
                
                // 调整白球位置
                const whiteLeft = parseFloat(this.whiteBall.style.left) || 0;
                const whiteTop = parseFloat(this.whiteBall.style.top) || 0;
                this.whiteBall.style.left = (whiteLeft * scaleX) + 'px';
                this.whiteBall.style.top = (whiteTop * scaleY) + 'px';
                
                // 调整红球位置
                const redLeft = parseFloat(this.redBall.style.left) || 0;
                const redTop = parseFloat(this.redBall.style.top) || 0;
                this.redBall.style.left = (redLeft * scaleX) + 'px';
                this.redBall.style.top = (redTop * scaleY) + 'px';
                
                // 调整障碍球位置
                const obstacleBalls = this.ballManager.obstacleBalls;
                obstacleBalls.forEach(ball => {
                    const left = parseFloat(ball.style.left) || 0;
                    const top = parseFloat(ball.style.top) || 0;
                    ball.style.left = (left * scaleX) + 'px';
                    ball.style.top = (top * scaleY) + 'px';
                });
            }
            
            this.renderer.drawTable(this.getShowGrid());
            if (this.currentPath) {
                this.calculatePath();
            }
        });
    }
    
    initEventListeners() {
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculatePath();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetBalls();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearPath();
        });
        
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.renderer.drawTable(e.target.checked);
            this.redrawAll();
        });
        
        document.getElementById('showAngles').addEventListener('change', () => {
            if (this.currentPath) {
                this.drawPath();
            }
        });
        
        document.getElementById('cushions').addEventListener('change', (e) => {
            this.clearPath();
            // 如果选择6库，自动启用方向模式
            if (e.target.value === '6') {
                document.getElementById('directionMode').checked = true;
                this.toggleDirectionMode(true);
            }
        });
        
        // 方向模式切换
        document.getElementById('directionMode').addEventListener('change', (e) => {
            this.toggleDirectionMode(e.target.checked);
        });
        
        // 方向滑块变化
        document.getElementById('direction').addEventListener('input', (e) => {
            const direction = parseInt(e.target.value);
            document.getElementById('directionValue').textContent = direction + '°';
            this.updateDirectionIndicator();
        });
        
        // 添加障碍球按钮
        document.getElementById('addObstacleBtn').addEventListener('click', () => {
            this.addObstacleBall();
        });
        
        // 清除障碍球按钮
        document.getElementById('clearObstaclesBtn').addEventListener('click', () => {
            this.clearObstacleBalls();
        });
    }
    
    getShowGrid() {
        return document.getElementById('showGrid').checked;
    }
    
    getShowAngles() {
        return document.getElementById('showAngles').checked;
    }
    
    getCushionCount() {
        return parseInt(document.getElementById('cushions').value);
    }
    
    resetBalls() {
        // 使用渲染器的显示尺寸（CSS 像素）
        const size = this.renderer.getDisplaySize();
        const width = size.width;
        const height = size.height;
        const ballRadius = 12; // 球体半径（直径24px）
        
        if (!width || !height) {
            return;
        }
        
        // 竖向球桌：白球放在蓝球点位上方一点点
        const blueX = width / 2;
        const blueY = height / 2;
        const whiteY = blueY - height * 0.05; // 蓝球上方约5%的距离
        this.whiteBall.style.left = (blueX - ballRadius) + 'px';
        this.whiteBall.style.top = (whiteY - ballRadius) + 'px';
        
        // 竖向球桌：红球放在粉球点位上方一点
        const pinkX = width / 2;
        const pinkY = height * 0.755; // 距离顶库75.5%
        const redY = pinkY - height * 0.08; // 粉球上方约8%的距离
        this.redBall.style.left = (pinkX - ballRadius) + 'px';
        this.redBall.style.top = (redY - ballRadius) + 'px';
        
        // 清除路径数据和信息
        this.currentPath = null;
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
        
        // 立即重绘
        this.renderer.drawTable(this.getShowGrid());
    }
    
    clearPath() {
        this.currentPath = null;
        this.renderer.drawTable(this.getShowGrid());
        // 注意：不在canvas上绘制障碍球，因为障碍球已经是DOM元素了
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
    }
    
    /**
     * 当球位置改变时的回调
     */
    onBallPositionChanged() {
        // 重绘canvas，包括标记点
        // 注意：不在canvas上绘制障碍球，因为障碍球已经是DOM元素了
        this.renderer.drawTable(this.getShowGrid());
        
        // 如果是方向模式，重绘方向指示器
        const directionMode = document.getElementById('directionMode').checked;
        if (directionMode) {
            const direction = parseInt(document.getElementById('direction').value);
            const whitePos = this.ballManager.getBallPosition(this.whiteBall);
            this.renderer.drawDirectionIndicator(whitePos, direction);
        }
        
        // 如果有当前路径，也重绘路径
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
    
    /**
     * 添加障碍球
     */
    addObstacleBall() {
        const canvasRect = this.canvas.getBoundingClientRect();
        // 在球桌中心附近随机位置添加障碍球
        const x = canvasRect.width * (0.3 + Math.random() * 0.4);
        const y = canvasRect.height * (0.3 + Math.random() * 0.4);
        
        this.ballManager.addObstacleBall(x, y);
        
        // 重绘canvas，包括标记点
        // 注意：不在canvas上绘制障碍球，因为障碍球已经是DOM元素了
        this.renderer.drawTable(this.getShowGrid());
        
        // 清除当前路径
        this.currentPath = null;
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
    }
    
    /**
     * 清除所有障碍球
     */
    clearObstacleBalls() {
        this.ballManager.clearObstacleBalls();
        // 重绘canvas，包括标记点
        this.renderer.drawTable(this.getShowGrid());
        // 清除路径信息
        this.currentPath = null;
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
    }
    
    calculatePath() {
        const whitePos = this.ballManager.getBallPosition(this.whiteBall);
        const redPos = this.ballManager.getBallPosition(this.redBall);
        const cushionCount = this.getCushionCount();
        const obstacleBalls = this.ballManager.getObstacleBallPositions();
        
        const size = this.renderer.getDisplaySize();
        const tableWidth = size.width;
        const tableHeight = size.height;
        
        // 检查是否为方向模式
        const directionMode = document.getElementById('directionMode').checked;
        const direction = directionMode ? parseInt(document.getElementById('direction').value) : 0;
        
        this.currentPath = this.pathCalculator.calculatePath(
            whitePos, 
            redPos, 
            cushionCount,
            tableWidth,
            tableHeight,
            obstacleBalls,
            directionMode,
            direction
        );
        
        if (!this.currentPath) {
            document.getElementById('pathInfo').innerHTML = '<p style="color: #ff6b6b;">❌ 无法找到有效路径！<br/>请尝试：<br/>1. 调整球的位置<br/>2. 移除或调整障碍球<br/>3. 更改撞库次数<br/>4. 调整发射角度</p>';
            this.renderer.drawTable(this.getShowGrid());
            // 重绘障碍球
            const obstacleBalls2 = this.ballManager.getObstacleBallPositions();
            this.renderer.drawObstacleBalls(obstacleBalls2);
            return;
        }
        
        this.drawPath();
        this.updatePathInfo();
    }
    
    drawPath() {
        this.renderer.drawTable(this.getShowGrid());
        
        // 注意：不在canvas上绘制障碍球，因为障碍球已经是DOM元素了
        
        if (!this.currentPath) return;
        
        const showAngles = this.getShowAngles();
        this.renderer.drawPath(this.currentPath, showAngles);
    }
    
    updatePathInfo() {
        if (!this.currentPath) return;
        
        const cushionCount = this.getCushionCount();
        const directionMode = document.getElementById('directionMode').checked;
        
        let html = '';
        
        if (directionMode && this.currentPath.direction !== undefined) {
            html += `<p><strong>模式：</strong>方向模式</p>`;
            html += `<p><strong>发射角度：</strong>${this.currentPath.direction}°</p>`;
        }
        
        html += `<p><strong>撞库次数：</strong>${cushionCount}库</p>`;
        html += `<p><strong>路径点数：</strong>${this.currentPath.points.length}个</p>`;
        
        if (this.currentPath.bouncePoints && this.currentPath.bouncePoints.length > 0) {
            html += `<p><strong>反弹点：</strong></p>`;
            this.currentPath.bouncePoints.forEach((point, index) => {
                const side = this.getSideName(point.side);
                html += `<p style="margin-left: 15px;">第${index + 1}次：${side}</p>`;
            });
        }
        
        const totalDistance = this.calculateTotalDistance();
        html += `<p><strong>总路径长度：</strong>${totalDistance.toFixed(0)}像素</p>`;
        
        document.getElementById('pathInfo').innerHTML = html;
    }
    
    getSideName(side) {
        const names = {
            'top': '顶库',
            'bottom': '底库',
            'left': '左库',
            'right': '右库'
        };
        return names[side] || side;
    }
    
    calculateTotalDistance() {
        if (!this.currentPath || !this.currentPath.points) return 0;
        
        let total = 0;
        for (let i = 1; i < this.currentPath.points.length; i++) {
            const p1 = this.currentPath.points[i - 1];
            const p2 = this.currentPath.points[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            total += Math.sqrt(dx * dx + dy * dy);
        }
        return total;
    }
    
    /**
     * 切换方向模式
     */
    toggleDirectionMode(enabled) {
        const directionControls = document.getElementById('directionControls');
        const cushionSelect = document.getElementById('cushions');
        
        if (enabled) {
            directionControls.style.display = 'block';
            cushionSelect.value = '6';
            cushionSelect.disabled = true;
            this.updateDirectionIndicator();
        } else {
            directionControls.style.display = 'none';
            cushionSelect.disabled = false;
            this.clearPath();
        }
    }
    
    /**
     * 更新方向指示器
     */
    updateDirectionIndicator() {
        const directionMode = document.getElementById('directionMode').checked;
        if (!directionMode) return;
        
        const direction = parseInt(document.getElementById('direction').value);
        const whitePos = this.ballManager.getBallPosition(this.whiteBall);
        
        // 重绘球桌
        this.renderer.drawTable(this.getShowGrid());
        
        // 绘制方向指示器
        this.renderer.drawDirectionIndicator(whitePos, direction);
        
        // 如果有当前路径，也重绘路径
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
    
    /**
     * 重绘所有内容
     */
    redrawAll() {
        this.renderer.drawTable(this.getShowGrid());
        
        // 如果是方向模式，绘制方向指示器
        const directionMode = document.getElementById('directionMode').checked;
        if (directionMode) {
            const direction = parseInt(document.getElementById('direction').value);
            const whitePos = this.ballManager.getBallPosition(this.whiteBall);
            this.renderer.drawDirectionIndicator(whitePos, direction);
        }
        
        // 如果有当前路径，重绘路径
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
}

// 确保DOM完全加载后再初始化
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnookerGame();
});