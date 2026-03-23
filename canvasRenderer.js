export class CanvasRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.displayWidth = canvas.clientWidth || canvas.width || 0;
        this.displayHeight = canvas.clientHeight || canvas.height || 0;
        this.pixelRatio = window.devicePixelRatio || 1;
    }
    
    setSize(width, height, pixelRatio = window.devicePixelRatio || 1) {
        this.displayWidth = width;
        this.displayHeight = height;
        this.pixelRatio = pixelRatio || 1;

        this.canvas.width = Math.floor(width * this.pixelRatio);
        this.canvas.height = Math.floor(height * this.pixelRatio);

        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';

        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    }
    
    getDisplaySize() {
        return {
            width: this.displayWidth,
            height: this.displayHeight
        };
    }
    
    clear() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        ctx.clearRect(0, 0, width, height);
    }
    
    drawTable(showGrid = true) {
        const ctx = this.ctx;
        this.clear();
        
        // 绘制绒布纹理效果
        this.drawClothTexture();
        
        this.drawPockets();
        
        if (showGrid) {
            this.drawGrid();
        }
        
        this.drawCushionMarkers();
    }
    
    /**
     * 绘制绒布纹理效果
     */
    drawClothTexture() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        
        // 模拟绒布纤维纹理 - 用半透明的微小线条
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        
        const spacing = 4;
        for (let x = 0; x < width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
        
        // 球桌内边缘微微发亮（模拟库边内侧光照）
        ctx.save();
        const edgeGlow = 6;
        const topGrad = ctx.createLinearGradient(0, 0, 0, edgeGlow);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, edgeGlow);
        
        const bottomGrad = ctx.createLinearGradient(0, height, 0, height - edgeGlow);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, height - edgeGlow, width, edgeGlow);
        
        const leftGrad = ctx.createLinearGradient(0, 0, edgeGlow, 0);
        leftGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        leftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, edgeGlow, height);
        
        const rightGrad = ctx.createLinearGradient(width, 0, width - edgeGlow, 0);
        rightGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
        rightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(width - edgeGlow, 0, edgeGlow, height);
        ctx.restore();
    }
    
    /**
     * 绘制球袋 - 横向球桌
     */
    drawPockets() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        
        const cornerR = Math.min(width, height) * 0.042;
        const midR = Math.min(width, height) * 0.034;
        const cornerOffset = cornerR * 0.35;
        
        // 四个角袋
        this.drawPocketCircle(cornerOffset, cornerOffset, cornerR);
        this.drawPocketCircle(width - cornerOffset, cornerOffset, cornerR);
        this.drawPocketCircle(cornerOffset, height - cornerOffset, cornerR);
        this.drawPocketCircle(width - cornerOffset, height - cornerOffset, cornerR);
        
        // 两个中袋
        this.drawPocketCircle(width / 2, 0, midR);
        this.drawPocketCircle(width / 2, height, midR);
    }
    
    drawPocketCircle(cx, cy, radius) {
        const ctx = this.ctx;
        
        const outerR = radius * 1.2;
        const edgeGrad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, outerR);
        edgeGrad.addColorStop(0, '#5a4a30');
        edgeGrad.addColorStop(0.4, '#8B7355');
        edgeGrad.addColorStop(0.7, '#6B5B3F');
        edgeGrad.addColorStop(1, '#4a3a20');
        
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = edgeGrad;
        ctx.fill();
        
        const pocketGrad = ctx.createRadialGradient(
            cx - radius * 0.15, cy - radius * 0.15, 0,
            cx, cy, radius
        );
        pocketGrad.addColorStop(0, '#1a1a1a');
        pocketGrad.addColorStop(0.3, '#111111');
        pocketGrad.addColorStop(0.7, '#080808');
        pocketGrad.addColorStop(1, '#000000');
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = pocketGrad;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 80, 50, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        const innerR = radius * 0.55;
        const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        innerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fillStyle = innerGrad;
        ctx.fill();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 0.5;
        
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
        
        // 中线稍明显
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    drawCushionMarkers() {
        this.drawSnookerSpots();
    }
    
    /**
     * 绘制斯诺克标记点 - 横向球桌
     */
    drawSnookerSpots() {
        const ctx = this.ctx;
        const { width, height } = this.getDisplaySize();
        const centerY = height / 2;
        
        // 开球线（Baulk line）
        const baulkLineX = width * 0.207;
        
        // 绘制开球线 - 稍微有光泽感
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.15)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.moveTo(baulkLineX, 0);
        ctx.lineTo(baulkLineX, height);
        ctx.stroke();
        ctx.restore();
        
        // D区半圆 - 带渐变描边效果
        const dRadius = width * 0.0575;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.12)';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(baulkLineX, centerY, dRadius, -Math.PI / 2, Math.PI / 2, true);
        ctx.stroke();
        ctx.restore();
        
        // D区内部微微加深效果
        ctx.save();
        ctx.beginPath();
        ctx.arc(baulkLineX, centerY, dRadius, -Math.PI / 2, Math.PI / 2, true);
        ctx.lineTo(baulkLineX, centerY - dRadius);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 50, 30, 0.08)';
        ctx.fill();
        ctx.restore();
        
        const spotRadius = 6;
        
        this.drawSpot(baulkLineX, centerY, spotRadius, '棕', '#8B4513');
        this.drawSpot(baulkLineX, centerY - dRadius, spotRadius, '绿', '#228B22');
        this.drawSpot(baulkLineX, centerY + dRadius, spotRadius, '黄', '#FFD700');
        this.drawSpot(width * 0.5, centerY, spotRadius, '蓝', '#4169E1');
        this.drawSpot(width * 0.755, centerY, spotRadius, '粉', '#FF69B4');
        this.drawSpot(width * 0.909, centerY, spotRadius, '黑', '#1a1a1a');
    }
    
    drawSpot(x, y, radius, label, color) {
        const ctx = this.ctx;
        const dotR = 3; // 小圆点半径，远小于球的11px
        const crossLen = 8; // 十字线臂长
        
        // 绘制十字标记线
        ctx.save();
        ctx.strokeStyle = this.colorWithAlpha(color, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - crossLen, y);
        ctx.lineTo(x + crossLen, y);
        ctx.moveTo(x, y - crossLen);
        ctx.lineTo(x, y + crossLen);
        ctx.stroke();
        ctx.restore();
        
        // 中心小实心圆点
        ctx.beginPath();
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // 圆点白色细边框增加可见性
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        
        // 文字标签
        ctx.fillStyle = this.colorWithAlpha(color, 0.85);
        ctx.font = '10px "PingFang SC", "Microsoft YaHei", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, y + crossLen + 2);
    }
    
    /**
     * 颜色工具 - 加亮
     */
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
        const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * 颜色工具 - 变暗
     */
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substring(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substring(2, 4), 16) - amount);
        const b = Math.max(0, parseInt(hex.substring(4, 6), 16) - amount);
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * 颜色工具 - 带透明度
     */
    colorWithAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    /**
     * 绘制路径
     * @param {Object} path - 路径对象
     * @param {boolean} showAngles - 是否显示角度信息
     */
    drawPath(path, showAngles = false) {
        if (!path || !path.points || path.points.length < 2) return;
        
        const ctx = this.ctx;
        
        // 路径发光底层
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 220, 50, 0.25)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
        
        // 绘制主路径线
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        
        // 细线辅助
        ctx.strokeStyle = 'rgba(255, 180, 50, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 绘制反弹点
        if (path.bouncePoints && path.bouncePoints.length > 0) {
            path.bouncePoints.forEach((bounce, index) => {
                this.drawBouncePoint(bounce.point, index + 1);
            });
        }
        
        // 绘制角度信息
        if (showAngles && path.bouncePoints && path.bouncePoints.length > 0) {
            this.drawAnglesInfo(path);
        }
        
        // 绘制方向箭头
        this.drawArrows(path.points);
    }
    
    drawBouncePoint(point, number) {
        const ctx = this.ctx;
        
        // 外圈发光
        const glowGrad = ctx.createRadialGradient(point.x, point.y, 4, point.x, point.y, 16);
        glowGrad.addColorStop(0, 'rgba(255, 80, 50, 0.5)');
        glowGrad.addColorStop(1, 'rgba(255, 80, 50, 0)');
        ctx.beginPath();
        ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
        
        // 外环
        ctx.beginPath();
        ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        
        // 主圆 - 渐变
        const grad = ctx.createRadialGradient(point.x - 2, point.y - 2, 0, point.x, point.y, 7);
        grad.addColorStop(0, '#ff6644');
        grad.addColorStop(0.6, '#ee2200');
        grad.addColorStop(1, '#aa0000');
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // 数字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "PingFang SC", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), point.x, point.y);
    }
    
    /**
     * 绘制角度信息
     */
    drawAnglesInfo(path) {
        const ctx = this.ctx;
        
        path.bouncePoints.forEach((bounce) => {
            const point = bounce.point;
            const incAngle = bounce.incidentAngle !== undefined ? bounce.incidentAngle : bounce.angle;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 2;
            
            const text = `入射角: ${incAngle.toFixed(1)}°`;
            const boxWidth = 100;
            const boxHeight = 24;
            const boxX = point.x - boxWidth / 2;
            const boxY = point.y - 35;
            
            // 圆角矩形背景
            this.drawRoundRect(boxX, boxY, boxWidth, boxHeight, 4);
            ctx.fill();
            this.drawRoundRect(boxX, boxY, boxWidth, boxHeight, 4);
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, point.x, boxY + boxHeight / 2);
            
            // 连接线
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(point.x, boxY + boxHeight);
            ctx.lineTo(point.x, point.y - 8);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }
    
    /**
     * 绘制圆角矩形路径
     */
    drawRoundRect(x, y, w, h, r) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    drawArrows(points) {
        const ctx = this.ctx;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            
            const arrowLength = 11;
            const arrowWidth = 6;
            
            // 箭头外发光
            ctx.save();
            ctx.shadowColor = 'rgba(255, 200, 0, 0.6)';
            ctx.shadowBlur = 4;
            
            ctx.fillStyle = '#ffe866';
            ctx.beginPath();
            ctx.moveTo(midX + 2 * Math.cos(angle), midY + 2 * Math.sin(angle));
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
            ctx.restore();
            
            ctx.strokeStyle = 'rgba(200, 140, 0, 0.6)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }
    
    drawObstacleBalls(obstacleBalls) {
        if (!obstacleBalls || obstacleBalls.length === 0) return;
        
        const ctx = this.ctx;
        const ballRadius = 12;
        
        obstacleBalls.forEach(pos => {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ballRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF8C00';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(pos.x - 3, pos.y - 3, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawDirectionIndicator(pos, direction) {
        const ctx = this.ctx;
        
        const angleRad = (direction * Math.PI) / 180;
        
        const arrowLength = 60;
        const endX = pos.x + arrowLength * Math.cos(angleRad);
        const endY = pos.y - arrowLength * Math.sin(angleRad);
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        const headLength = 15;
        const headAngle = Math.PI / 6;
        
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