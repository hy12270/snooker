import { BallManager } from './ballManager.js';
import { PathCalculator } from './pathCalculator.js';
import { CanvasRenderer } from './canvasRenderer.js';

class SnookerGame {
    constructor() {
        this.canvas = document.getElementById('snookerTable');
        this.ctx = this.canvas.getContext('2d');
        this.whiteBall = document.getElementById('whiteBall');
        this.redBall = document.getElementById('redBall');
        
        // 检测是否为移动端
        this.isMobile = window.innerWidth <= 768;
        
        // 传入回调函数，当球位置改变时重绘canvas
        this.ballManager = new BallManager(this.whiteBall, this.redBall, this.canvas, () => {
            this.onBallPositionChanged();
        });
        this.pathCalculator = new PathCalculator();
        this.renderer = new CanvasRenderer(this.canvas, this.ctx);
        
        this.initEventListeners();
        this.initMobilePanel();
        this.initCanvas();
        
        // 立即设置球的位置
        this.resetBalls();
    }
    
    /**
     * 获取当前球的CSS半径（移动端球更大）
     */
    getBallCSSRadius() {
        return this.isMobile ? 14 : 12;
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
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            // 防抖处理，避免频繁触发
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 150);
        });

        // 监听屏幕方向变化
        if (window.screen && window.screen.orientation) {
            window.screen.orientation.addEventListener('change', () => {
                setTimeout(() => this.handleResize(), 300);
            });
        }
    }

    handleResize() {
        const container = this.canvas.parentElement;
        const newRect = container.getBoundingClientRect();
        const oldSize = this.renderer.getDisplaySize();
        const oldWidth = oldSize.width;
        const oldHeight = oldSize.height;

        // 记录旧方向
        const wasVertical = oldHeight > oldWidth * 1.3;

        // 更新移动端状态
        this.isMobile = window.innerWidth <= 768;

        const newPixelRatio = window.devicePixelRatio || 1;
        this.renderer.setSize(newRect.width, newRect.height, newPixelRatio);

        // 检查新方向
        const isNowVertical = this.isVertical();
        const orientationChanged = wasVertical !== isNowVertical;

        if (oldWidth > 0 && oldHeight > 0) {
            const ballRadius = this.getBallCSSRadius();
            const oldBallRadius = 12; // 旧的默认半径

            // 更新所有球的位置
            const allBalls = [this.whiteBall, this.redBall, ...this.ballManager.obstacleBalls];

            allBalls.forEach(ball => {
                const left = parseFloat(ball.style.left) || 0;
                const top = parseFloat(ball.style.top) || 0;
                // 获取中心点在旧球桌中的相对比例
                const relX = (left + oldBallRadius) / oldWidth;
                const relY = (top + oldBallRadius) / oldHeight;

                let newCenterX, newCenterY;

                if (orientationChanged) {
                    // 方向切换：X/Y互换
                    // 横→竖：旧的X比例映射到新的Y比例，旧的Y比例映射到新的X比例
                    // 竖→横：同理
                    newCenterX = relY * newRect.width;
                    newCenterY = relX * newRect.height;
                } else {
                    // 仅缩放
                    newCenterX = relX * newRect.width;
                    newCenterY = relY * newRect.height;
                }

                // 限制在球桌范围内
                newCenterX = Math.max(ballRadius, Math.min(newCenterX, newRect.width - ballRadius));
                newCenterY = Math.max(ballRadius, Math.min(newCenterY, newRect.height - ballRadius));

                ball.style.left = (newCenterX - ballRadius) + 'px';
                ball.style.top = (newCenterY - ballRadius) + 'px';
            });

            // 更新ballManager的球半径
            this.ballManager.updateBallRadius(ballRadius);
        }

        this.renderer.drawTable(this.getShowGrid());
        if (this.currentPath) {
            this.calculatePath();
        }
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

        // 移动端快捷按钮
        const mobileCalcBtn = document.getElementById('mobileCalculateBtn');
        if (mobileCalcBtn) {
            mobileCalcBtn.addEventListener('click', () => {
                this.calculatePath();
            });
        }
    }

    /**
     * 初始化移动端面板折叠交互
     */
    initMobilePanel() {
        const panelHeader = document.getElementById('panelHeaderMobile');
        const panelBody = document.getElementById('panelBody');
        const toggleBtn = document.getElementById('mobileTogglePanelBtn');

        if (panelHeader && panelBody) {
            panelHeader.addEventListener('click', () => {
                const isExpanded = panelBody.classList.contains('expanded');
                panelBody.classList.toggle('expanded');
                panelHeader.classList.toggle('expanded');
            });
        }

        // "设置"按钮打开/关闭面板
        if (toggleBtn && panelBody && panelHeader) {
            toggleBtn.addEventListener('click', () => {
                const isExpanded = panelBody.classList.contains('expanded');
                panelBody.classList.toggle('expanded');
                panelHeader.classList.toggle('expanded');

                // 滚动到面板位置
                if (!isExpanded) {
                    setTimeout(() => {
                        document.getElementById('controlPanel').scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            });
        }
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
    
    /**
     * 判断是否为竖排模式
     */
    isVertical() {
        return this.renderer.isVertical();
    }

    resetBalls() {
        const size = this.renderer.getDisplaySize();
        const width = size.width;
        const height = size.height;
        const ballRadius = this.getBallCSSRadius();
        
        if (!width || !height) {
            return;
        }

        if (this.isVertical()) {
            // 竖排模式：长轴为Y，横排的X比例→竖排的Y比例
            const centerX = width / 2;

            // 白球：蓝球点位附近偏上
            const blueY = height * 0.5;
            const whiteY = blueY - height * 0.05;
            this.whiteBall.style.left = (centerX - ballRadius) + 'px';
            this.whiteBall.style.top = (whiteY - ballRadius) + 'px';

            // 红球：粉球点位附近偏下
            const pinkY = height * 0.755;
            const redY = pinkY - height * 0.08;
            this.redBall.style.left = (centerX - ballRadius) + 'px';
            this.redBall.style.top = (redY - ballRadius) + 'px';
        } else {
            // 横排模式（原逻辑）
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
        }
        
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
        if (this.isVertical()) {
            // 竖排：top是短边（上方baulk端），bottom是短边（下方黑球端）
            // left/right 是长边
            const names = {
                'top': '顶库(A)',
                'bottom': '底库(B)',
                'left': '左侧库',
                'right': '右侧库'
            };
            return names[side] || side;
        }
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
