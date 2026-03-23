export class BallManager {
    constructor(whiteBall, redBall, canvas, onChange = null) {
        this.whiteBall = whiteBall;
        this.redBall = redBall;
        this.canvas = canvas;
        this.draggedBall = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.obstacleBalls = []; // 障碍球数组
        this.onChange = onChange; // 当球位置改变时的回调
        
        // 动态球半径，移动端更大
        this.ballRadius = this.isMobileDevice() ? 14 : 12;
        
        this.initDragAndDrop();
    }

    /**
     * 检测是否为移动设备
     */
    isMobileDevice() {
        return window.innerWidth <= 768 || 'ontouchstart' in window;
    }

    /**
     * 更新球半径（响应式变化时调用）
     */
    updateBallRadius(newRadius) {
        this.ballRadius = newRadius;
    }
    
    initDragAndDrop() {
        [this.whiteBall, this.redBall].forEach(ball => {
            ball.addEventListener('mousedown', (e) => this.onMouseDown(e, ball));
            ball.addEventListener('touchstart', (e) => this.onTouchStart(e, ball), { passive: false });
        });
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        
        document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        document.addEventListener('touchend', () => this.onTouchEnd());
    }
    
    /**
     * 添加障碍球
     */
    addObstacleBall(x, y) {
        const obstacleBall = document.createElement('div');
        obstacleBall.className = 'ball obstacle-ball';
        obstacleBall.innerHTML = '<span class="ball-label">障</span>';
        obstacleBall.draggable = true;
        
        const r = this.ballRadius;
        obstacleBall.style.left = (x - r) + 'px';
        obstacleBall.style.top = (y - r) + 'px';
        
        // 添加拖动事件
        obstacleBall.addEventListener('mousedown', (e) => this.onMouseDown(e, obstacleBall));
        obstacleBall.addEventListener('touchstart', (e) => this.onTouchStart(e, obstacleBall), { passive: false });
        
        // 添加右键删除功能
        obstacleBall.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.removeObstacleBall(obstacleBall);
        });
        
        // 添加双击删除功能（移动端也适用）
        obstacleBall.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.removeObstacleBall(obstacleBall);
        });

        // 移动端长按删除
        let longPressTimer = null;
        obstacleBall.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.removeObstacleBall(obstacleBall);
                // 取消正在进行的拖拽
                if (this.draggedBall === obstacleBall) {
                    this.draggedBall.classList.remove('dragging');
                    this.draggedBall = null;
                }
            }, 800);
        }, { passive: true });

        obstacleBall.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        obstacleBall.addEventListener('touchmove', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });
        
        this.canvas.parentElement.appendChild(obstacleBall);
        this.obstacleBalls.push(obstacleBall);
        
        return obstacleBall;
    }
    
    /**
     * 移除障碍球
     */
    removeObstacleBall(ball) {
        const index = this.obstacleBalls.indexOf(ball);
        if (index > -1) {
            this.obstacleBalls.splice(index, 1);
        }
        ball.remove();
    }
    
    /**
     * 清除所有障碍球
     */
    clearObstacleBalls() {
        const ballsToRemove = [...this.obstacleBalls];
        ballsToRemove.forEach(ball => {
            if (ball && ball.classList && ball.classList.contains('obstacle-ball')) {
                ball.remove();
            }
        });
        this.obstacleBalls = [];
    }
    
    /**
     * 获取所有障碍球的位置
     */
    getObstacleBallPositions() {
        return this.obstacleBalls.map(ball => this.getBallPosition(ball));
    }
    
    onMouseDown(e, ball) {
        e.preventDefault();
        e.stopPropagation();
        this.draggedBall = ball;
        ball.classList.add('dragging');
        const rect = ball.getBoundingClientRect();
        const r = this.ballRadius;
        this.offsetX = e.clientX - rect.left - r;
        this.offsetY = e.clientY - rect.top - r;
    }
    
    onTouchStart(e, ball) {
        e.preventDefault();
        e.stopPropagation();
        this.draggedBall = ball;
        ball.classList.add('dragging');
        const rect = ball.getBoundingClientRect();
        const touch = e.touches[0];
        const r = this.ballRadius;
        // 移动端向上偏移，让手指不遮挡球
        this.offsetX = touch.clientX - rect.left - r;
        this.offsetY = touch.clientY - rect.top - r + (this.isMobileDevice() ? 10 : 0);
    }
    
    onMouseMove(e) {
        if (!this.draggedBall) return;
        e.preventDefault();
        this._moveBall(e.clientX, e.clientY);
    }
    
    onTouchMove(e) {
        if (!this.draggedBall) return;
        e.preventDefault();
        const touch = e.touches[0];
        this._moveBall(touch.clientX, touch.clientY);
    }

    /**
     * 通用移动球逻辑
     */
    _moveBall(clientX, clientY) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const r = this.ballRadius;

        let centerX = clientX - canvasRect.left - this.offsetX;
        let centerY = clientY - canvasRect.top - this.offsetY;

        // 限制在球桌范围内
        centerX = Math.max(r, Math.min(centerX, canvasRect.width - r));
        centerY = Math.max(r, Math.min(centerY, canvasRect.height - r));

        this.draggedBall.style.left = (centerX - r) + 'px';
        this.draggedBall.style.top = (centerY - r) + 'px';
    }
    
    onMouseUp() {
        if (this.draggedBall) {
            this.draggedBall.classList.remove('dragging');
            if (this.onChange) {
                this.onChange();
            }
        }
        this.draggedBall = null;
    }
    
    onTouchEnd() {
        if (this.draggedBall) {
            this.draggedBall.classList.remove('dragging');
            if (this.onChange) {
                this.onChange();
            }
        }
        this.draggedBall = null;
    }
    
    getBallPosition(ball) {
        const left = parseFloat(ball.style.left) || 0;
        const top = parseFloat(ball.style.top) || 0;
        const r = this.ballRadius;
        return {
            x: left + r,
            y: top + r
        };
    }
}
