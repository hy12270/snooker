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
            
            this.renderer.setSize(rect.width, rect.height, pixelRatio);
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
            this.renderer.setSize(newRect.width, newRect.height, newPixelRatio);
            
            if (oldWidth > 0 && oldHeight > 0) {
                const scaleX = newRect.width / oldWidth;
                const scaleY = newRect.height / oldHeight;
                
                const whiteLeft = parseFloat(this.whiteBall.style.left) || 0;
                const whiteTop = parseFloat(this.whiteBall.style.top) || 0;
                this.whiteBall.style.left = (whiteLeft * scaleX) + 'px';
                this.whiteBall.style.top = (whiteTop * scaleY) + 'px';
                
                const redLeft = parseFloat(this.redBall.style.left) || 0;
                const redTop = parseFloat(this.redBall.style.top) || 0;
                this.redBall.style.left = (redLeft * scaleX) + 'px';
                this.redBall.style.top = (redTop * scaleY) + 'px';
                
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
        const size = this.renderer.getDisplaySize();
        const width = size.width;
        const height = size.height;
        const ballRadius = 11;
        
        if (!width || !height) {
            return;
        }
        
        const blueX = width * 0.5;
        const blueY = height / 2;
        const whiteX = blueX - width * 0.05;
        this.whiteBall.style.left = (whiteX - ballRadius) + 'px';
        this.whiteBall.style.top = (blueY - ballRadius) + 'px';
        
        const pinkX = width * 0.755;
        const pinkY = height / 2;
        const redX = pinkX - width * 0.08;
        this.redBall.style.left = (redX - ballRadius) + 'px';
        this.redBall.style.top = (pinkY - ballRadius) + 'px';
        
        this.currentPath = null;
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
        this.renderer.drawTable(this.getShowGrid());
    }
    
    clearPath() {
        this.currentPath = null;
        this.renderer.drawTable(this.getShowGrid());
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
    }
    
    onBallPositionChanged() {
        this.renderer.drawTable(this.getShowGrid());
        
        const directionMode = document.getElementById('directionMode').checked;
        if (directionMode) {
            const direction = parseInt(document.getElementById('direction').value);
            const whitePos = this.ballManager.getBallPosition(this.whiteBall);
            this.renderer.drawDirectionIndicator(whitePos, direction);
        }
        
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
    
    addObstacleBall() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const x = canvasRect.width * (0.3 + Math.random() * 0.4);
        const y = canvasRect.height * (0.3 + Math.random() * 0.4);
        
        this.ballManager.addObstacleBall(x, y);
        this.renderer.drawTable(this.getShowGrid());
        
        this.currentPath = null;
        document.getElementById('pathInfo').innerHTML = '<p>等待计算...</p>';
    }
    
    clearObstacleBalls() {
        this.ballManager.clearObstacleBalls();
        this.renderer.drawTable(this.getShowGrid());
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
            return;
        }
        
        this.drawPath();
        this.updatePathInfo();
    }
    
    drawPath() {
        this.renderer.drawTable(this.getShowGrid());
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
            html += `<p style="margin-top: 8px;"><strong>反弹详情：</strong></p>`;
            this.currentPath.bouncePoints.forEach((bounce, index) => {
                const side = this.getSideName(bounce.side);
                const incAngle = bounce.incidentAngle !== undefined ? bounce.incidentAngle.toFixed(1) : bounce.angle.toFixed(1);
                
                html += `<p style="margin-left: 15px; font-size: 0.85em;">`;
                html += `第${index + 1}次 → ${side}`;
                html += ` | 入射角 ${incAngle}°`;
                html += `</p>`;
            });
        }
        
        const totalDistance = this.calculateTotalDistance();
        html += `<p><strong>总路径长度：</strong>${totalDistance.toFixed(0)}像素</p>`;
        
        document.getElementById('pathInfo').innerHTML = html;
    }
    
    getSideName(side) {
        const names = {
            'top': '上侧库',
            'bottom': '下侧库',
            'left': '底库(A)',
            'right': '顶库(B)'
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
    
    updateDirectionIndicator() {
        const directionMode = document.getElementById('directionMode').checked;
        if (!directionMode) return;
        
        const direction = parseInt(document.getElementById('direction').value);
        const whitePos = this.ballManager.getBallPosition(this.whiteBall);
        
        this.renderer.drawTable(this.getShowGrid());
        this.renderer.drawDirectionIndicator(whitePos, direction);
        
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
    
    redrawAll() {
        this.renderer.drawTable(this.getShowGrid());
        
        const directionMode = document.getElementById('directionMode').checked;
        if (directionMode) {
            const direction = parseInt(document.getElementById('direction').value);
            const whitePos = this.ballManager.getBallPosition(this.whiteBall);
            this.renderer.drawDirectionIndicator(whitePos, direction);
        }
        
        if (this.currentPath) {
            const showAngles = this.getShowAngles();
            this.renderer.drawPath(this.currentPath, showAngles);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new SnookerGame();
});