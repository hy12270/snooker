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
        
        this.initDragAndDrop();
    }
    
    initDragAndDrop() {
        [this.whiteBall, this.redBall].forEach(ball => {
            ball.addEventListener('mousedown', (e) => this.onMouseDown(e, ball));
            ball.addEventListener('touchstart', (e) => this.onTouchStart(e, ball));
        });
        
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mouseup', () => this.onMouseUp());
        
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
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
        
        const ballRadius = 11;
        obstacleBall.style.left = (x - ballRadius) + 'px';
        obstacleBall.style.top = (y - ballRadius) + 'px';
        
        // 添加拖动事件
        obstacleBall.addEventListener('mousedown', (e) => this.onMouseDown(e, obstacleBall));
        obstacleBall.addEventListener('touchstart', (e) => this.onTouchStart(e, obstacleBall));
        
        // 添加右键删除功能
        obstacleBall.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.removeObstacleBall(obstacleBall);
        });
        
        // 添加双击删除功能
        obstacleBall.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.removeObstacleBall(obstacleBall);
        });
        
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
        // 创建副本数组，避免在遍历时修改原数组
        const ballsToRemove = [...this.obstacleBalls];
        ballsToRemove.forEach(ball => {
            // 确保只删除障碍球
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
        const ballRadius = 11; // 球的实际半径
        // 计算鼠标相对于球中心的偏移
        this.offsetX = e.clientX - rect.left - ballRadius;
        this.offsetY = e.clientY - rect.top - ballRadius;
    }
    
    onTouchStart(e, ball) {
        e.preventDefault();
        e.stopPropagation();
        this.draggedBall = ball;
        ball.classList.add('dragging');
        const rect = ball.getBoundingClientRect();
        const touch = e.touches[0];
        const ballRadius = 11; // 球的实际半径
        // 计算触摸点相对于球中心的偏移
        this.offsetX = touch.clientX - rect.left - ballRadius;
        this.offsetY = touch.clientY - rect.top - ballRadius;
    }
    
    onMouseMove(e) {
        if (!this.draggedBall) return;
        e.preventDefault();
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const ballRadius = 11; // 球的实际半径
        // 计算球中心位置
        let centerX = e.clientX - canvasRect.left - this.offsetX;
        let centerY = e.clientY - canvasRect.top - this.offsetY;
        
        // 限制在球桌范围内
        centerX = Math.max(ballRadius, Math.min(centerX, canvasRect.width - ballRadius));
        centerY = Math.max(ballRadius, Math.min(centerY, canvasRect.height - ballRadius));
        
        // 设置球的左上角位置
        this.draggedBall.style.left = (centerX - ballRadius) + 'px';
        this.draggedBall.style.top = (centerY - ballRadius) + 'px';
    }
    
    onTouchMove(e) {
        if (!this.draggedBall) return;
        e.preventDefault();
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const ballRadius = 11; // 球的实际半径
        const touch = e.touches[0];
        // 计算球中心位置
        let centerX = touch.clientX - canvasRect.left - this.offsetX;
        let centerY = touch.clientY - canvasRect.top - this.offsetY;
        
        // 限制在球桌范围内
        centerX = Math.max(ballRadius, Math.min(centerX, canvasRect.width - ballRadius));
        centerY = Math.max(ballRadius, Math.min(centerY, canvasRect.height - ballRadius));
        
        // 设置球的左上角位置
        this.draggedBall.style.left = (centerX - ballRadius) + 'px';
        this.draggedBall.style.top = (centerY - ballRadius) + 'px';
    }
    
    onMouseUp() {
        if (this.draggedBall) {
            this.draggedBall.classList.remove('dragging');
            if (this.onChange) {
                this.onChange(); // 触发回调，通知位置改变
            }
        }
        this.draggedBall = null;
    }
    
    onTouchEnd() {
        if (this.draggedBall) {
            this.draggedBall.classList.remove('dragging');
            if (this.onChange) {
                this.onChange(); // 触发回调，通知位置改变
            }
        }
        this.draggedBall = null;
    }
    
    getBallPosition(ball) {
        const left = parseFloat(ball.style.left) || 0;
        const top = parseFloat(ball.style.top) || 0;
        const ballRadius = 11; // 球的半径（直径22px）
        return {
            x: left + ballRadius,
            y: top + ballRadius
        };
    }
}