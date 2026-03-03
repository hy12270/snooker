export class CanvasRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        // 记录画布显示尺寸（CSS 像素）和当前 DPI 缩放
        this.displayWidth = canvas.clientWidth || canvas.width || 0;
        this.displayHeight = canvas.clientHeight || canvas.height || 0;
        this.pixelRatio = window.devicePixelRatio || 1;
    }
    
    /**
     * 初始化或在窗口缩放时统一设置 canvas 尺寸和 DPI 缩放
     * @param {number} width  CSS 像素宽度
     * @param {number} height CSS 像素高度
     * @param {number} pixelRatio 设备像素比
     */
    setSize(width, height, pixelRatio = window.devicePixelRatio || 1) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.pixelRatio = pixelRatio || 1;

        // 设置实际像素尺寸（用于高清显示）
        this.canvas.width = Math.floor(width * this.pixelRatio);
        this.canvas.height = Math.floor(height * this.pixelRatio);

        // 保持 CSS 尺寸与容器一致
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        // 将坐标系缩放到以 CSS 像素为单位
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }
    
    // 获取canvas的绘制尺寸（使用CSS尺寸，保证与球和路径坐标一致）
    getDisplaySize() {
        return {
            width: this.displayWidth,
            height: this.displayHeight
        };
    }
    
    // 在保持 DPI 缩放的前提下清空画布
    clear() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        ctx.clearRect(0, 0, width, height);
    }
    
    drawTable(showGrid = true) {
        const ctx = this.ctx;
        this.clear();
        
        if (showGrid) {
            this.drawGrid();
        }
        
        this.drawCushionMarkers();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        for (let x = gridSize; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = gridSize; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 竖向球桌：中线是横向的（横向穿过球桌中心）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // 中心纵线（纵向穿过球桌中心）
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
    }
    
    drawCushionMarkers() {
        // 只绘制标准斯诺克球桌标记点（彩球点位、开球线、D区）
        // 不绘制库边标记线，因为真实球桌上没有这些
        this.drawSnookerSpots();
    }
    
    drawSnookerSpots() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        const centerX = width / 2;
        
        // 竖向球桌：开球线（D区）- 距离顶库约20.7%处
        const baulkLineY = height * 0.207; // 距离顶库20.7%
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, baulkLineY);
        ctx.lineTo(width, baulkLineY);
        ctx.stroke();
        
        // D区半圆（竖向球桌，半圆朝下）
        // D区半径应该是球桌高度的11.5%（标准斯诺克球桌比例）
        const dRadius = height * 0.115; // D区半径约为球桌高度的11.5%
        ctx.beginPath();
        ctx.arc(centerX, baulkLineY, dRadius, 0, Math.PI); // 下半圆
        ctx.stroke();
        
        // 绘制彩球点位
        const spotRadius = 5;
        
        // 棕球点（开球线中点）
        this.drawSpot(centerX, baulkLineY, spotRadius, '棕', '#8B4513');
        
        // 绿球点（开球线左侧，D区边缘）
        const greenX = centerX - dRadius;
        const greenY = baulkLineY;
        this.drawSpot(greenX, greenY, spotRadius, '绿', '#228B22');
        
        // 黄球点（开球线右侧，D区边缘）
        const yellowX = centerX + dRadius;
        const yellowY = baulkLineY;
        this.drawSpot(yellowX, yellowY, spotRadius, '黄', '#FFD700');
        
        // 蓝球点（中心点，精确对齐中袋）
        const blueX = centerX;
        const blueY = height * 0.5;
        this.drawSpot(blueX, blueY, spotRadius, '蓝', '#4169E1');
        
        // 粉球点（距离底库约24.5%）
        const pinkX = centerX;
        const pinkY = height * 0.755; // 距离顶库75.5%（距离底库24.5%）
        this.drawSpot(pinkX, pinkY, spotRadius, '粉', '#FF69B4');
        
        // 黑球点（距离底库约9.1%）
        const blackX = centerX;
        const blackY = height * 0.909; // 距离顶库90.9%（距离底库9.1%）
        this.drawSpot(blackX, blackY, spotRadius, '黑', '#000000');
    }
    
    drawSpot(x, y, radius, label, color) {
        const ctx = this.ctx;
        
        // 绘制点位圆圈
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制标签
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y + radius + 4);
    }
    
    drawPath(path, showAngles = false) {
        if (!path || !path.points || path.points.length < 2) return;
        
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        
        ctx.stroke();
        
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (path.bouncePoints && path.bouncePoints.length > 0) {
            path.bouncePoints.forEach((bounce, index) => {
                this.drawBouncePoint(bounce.point, index + 1);
            });
        }
        
        if (showAngles && path.points.length >= 3) {
            this.drawAngles(path);
        }
        
        this.drawArrows(path.points);
    }
    
    drawBouncePoint(point, number) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), point.x, point.y);
    }
    
    drawAngles(path) {
        const ctx = this.ctx;
        
        // 显示每个反弹点的入射角
        if (path.bouncePoints && path.bouncePoints.length > 0) {
            path.bouncePoints.forEach((bounce, index) => {
                const point = bounce.point;
                const angle = bounce.angle;
                
                if (angle !== undefined) {
                    // 绘制角度标注背景
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.strokeStyle = '#667eea';
                    ctx.lineWidth = 2;
                    
                    const boxWidth = 85;
                    const boxHeight = 24;
                    const boxX = point.x - boxWidth / 2;
                    const boxY = point.y - 35;
                    
                    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
                    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
                    
                    // 绘制角度文字
                    ctx.fillStyle = '#333333';
                    ctx.font = 'bold 11px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`入射角: ${angle.toFixed(1)}°`, point.x, boxY + boxHeight / 2);
                    
                    // 绘制指示线
                    ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(point.x, boxY + boxHeight);
                    ctx.lineTo(point.x, point.y - 8);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            });
        }
    }
    
    drawArrows(points) {
        const ctx = this.ctx;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            const arrowLength = 12;
            const arrowWidth = 8;
            
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(
                midX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
                midY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
            );
            ctx.lineTo(
                midX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
                midY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
            );
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
    
    /**
     * 绘制障碍球（在canvas上显示）
     */
    drawObstacleBalls(obstacleBalls) {
        if (!obstacleBalls || obstacleBalls.length === 0) return;
        
        const ctx = this.ctx;
        const ballRadius = 12;
        
        obstacleBalls.forEach(pos => {
            // 绘制障碍球
            ctx.fillStyle = '#FFA500'; // 橙色
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制边框
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 绘制高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(pos.x - 3, pos.y - 3, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    /**
     * 绘制方向指示器
     * @param {Object} pos 白球位置
     * @param {number} direction 方向角度（度数）
     */
    drawDirectionIndicator(pos, direction) {
        const ctx = this.ctx;
        
        // 将角度转换为弧度
        const angleRad = (direction * Math.PI) / 180;
        
        // 计算箭头终点（长度为60像素）
        const arrowLength = 60;
        const endX = pos.x + arrowLength * Math.cos(angleRad);
        const endY = pos.y - arrowLength * Math.sin(angleRad); // y轴向下为正
        
        // 绘制箭头线
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 绘制箭头头部
        const headLength = 15;
        const headAngle = Math.PI / 6; // 30度
        
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angleRad - headAngle),
            endY + headLength * Math.sin(angleRad - headAngle)
        );
        ctx.lineTo(
            endX - headLength * Math.cos(angleRad + headAngle),
            endY + headLength * Math.sin(angleRad + headAngle)
        );
        ctx.closePath();
        ctx.fill();
        
        // 绘制角度标签
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const labelX = pos.x + (arrowLength / 2) * Math.cos(angleRad);
        const labelY = pos.y - (arrowLength / 2) * Math.sin(angleRad) - 15;
        
        const text = `${direction}°`;
        ctx.strokeText(text, labelX, labelY);
        ctx.fillText(text, labelX, labelY);
    }
}