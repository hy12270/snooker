export class PathCalculator {
    constructor() {
        // 斯诺克球直径为52.5mm，这里使用像素表示
        this.ballRadius = 12; // 半径12像素（直径24px）
        
        // 球袋位置（相对于球桌的比例）- 竖向球桌
        this.pockets = [
            { x: 0, y: 0, radius: 0.03 },           // 左上角
            { x: 1, y: 0, radius: 0.03 },           // 右上角
            { x: 0, y: 0.5, radius: 0.025 },        // 中左
            { x: 1, y: 0.5, radius: 0.025 },        // 中右
            { x: 0, y: 1, radius: 0.03 },           // 左下角
            { x: 1, y: 1, radius: 0.03 }            // 右下角
        ];
    }
    
    calculatePath(whitePos, redPos, cushionCount, tableWidth, tableHeight, obstacleBalls = [], directionMode = false, direction = 0) {
        // 方向模式：从白球点位按指定方向发射，计算6库路径
        if (directionMode && cushionCount === 6) {
            return this.calculateDirectionalPath(whitePos, direction, tableWidth, tableHeight);
        }
        
        if (cushionCount === 0) {
            const directPath = this.calculateDirectPath(whitePos, redPos);
            // 检查直接路径是否碰到障碍球
            if (this.pathIntersectsObstacles(directPath.points, obstacleBalls)) {
                return null; // 直接路径被障碍球阻挡
            }
            // 检查直接路径是否碰到袋口
            if (this.pathIntersectsPockets(directPath.points, tableWidth, tableHeight)) {
                return null; // 直接路径碰到袋口
            }
            return directPath;
        }
        
        return this.calculateCushionPath(whitePos, redPos, cushionCount, tableWidth, tableHeight, obstacleBalls);
    }
    
    calculateDirectPath(whitePos, redPos) {
        return {
            points: [whitePos, redPos],
            bouncePoints: [],
            angles: []
        };
    }
    
    /**
     * 计算撞库路径 - 使用镜像法
     * N库的意思是：白球先撞击N个库边，然后击中目标球
     */
    calculateCushionPath(whitePos, redPos, cushionCount, tableWidth, tableHeight, obstacleBalls = []) {
        // 尝试多种可能的撞库序列
        const possibleSequences = this.generateCushionSequences(cushionCount);
        
        let bestPath = null;
        let bestScore = -Infinity;
        
        for (const sequence of possibleSequences) {
            const path = this.calculatePathWithMirrorMethod(
                whitePos, 
                redPos, 
                sequence, 
                tableWidth, 
                tableHeight
            );
            
            if (path && path.bouncePoints.length === cushionCount) {
                // 检查路径是否碰到障碍球
                if (this.pathIntersectsObstacles(path.points, obstacleBalls)) {
                    continue; // 跳过被障碍球阻挡的路径
                }
                
                // 检查路径是否碰到袋口
                if (this.pathIntersectsPockets(path.points, tableWidth, tableHeight)) {
                    continue; // 跳过碰到袋口的路径
                }
                
                // 一库规则：检查路径是否经过白球和目标球之间的区域
                if (cushionCount === 1) {
                    // 检查第一段路径（白球到库边）是否经过目标球
                    const firstSegment = [path.points[0], path.points[1]];
                    const distToRed1 = this.pointToSegmentDistance(redPos, firstSegment[0], firstSegment[1]);
                    if (distToRed1 < this.ballRadius * 2.2) {
                        continue; // 一库时第一段不能经过目标球
                    }
                    
                    // 检查第二段路径（库边到目标球）是否经过白球
                    const secondSegment = [path.points[1], path.points[2]];
                    const distToWhite = this.pointToSegmentDistance(whitePos, secondSegment[0], secondSegment[1]);
                    if (distToWhite < this.ballRadius * 2.2) {
                        continue; // 一库时第二段不能经过白球
                    }
                }
                
                const score = this.evaluatePath(path, whitePos, redPos, tableWidth, tableHeight);
                if (score > bestScore) {
                    bestScore = score;
                    bestPath = path;
                }
            }
        }
        
        return bestPath;
    }
    
    /**
     * 生成可能的撞库序列
     */
    generateCushionSequences(cushionCount) {
        const sides = ['top', 'bottom', 'left', 'right'];
        const sequences = [];
        
        if (cushionCount === 1) {
            // 一库：4种可能
            sides.forEach(s => sequences.push([s]));
        } else if (cushionCount === 2) {
            // 二库：相邻的库边组合
            const patterns = [
                ['top', 'right'],
                ['top', 'left'],
                ['bottom', 'right'],
                ['bottom', 'left'],
                ['left', 'top'],
                ['left', 'bottom'],
                ['right', 'top'],
                ['right', 'bottom']
            ];
            sequences.push(...patterns);
        } else if (cushionCount === 3) {
            // 三库：常见的三库组合
            const patterns = [
                ['top', 'right', 'bottom'],
                ['top', 'left', 'bottom'],
                ['bottom', 'right', 'top'],
                ['bottom', 'left', 'top'],
                ['left', 'top', 'right'],
                ['left', 'bottom', 'right'],
                ['right', 'top', 'left'],
                ['right', 'bottom', 'left'],
                ['top', 'right', 'left'],
                ['top', 'left', 'right'],
                ['bottom', 'right', 'left'],
                ['bottom', 'left', 'right'],
                ['left', 'top', 'bottom'],
                ['left', 'bottom', 'top'],
                ['right', 'top', 'bottom'],
                ['right', 'bottom', 'top']
            ];
            sequences.push(...patterns);
        } else if (cushionCount === 4) {
            // 四库：绕球桌的组合
            const patterns = [
                ['top', 'right', 'bottom', 'left'],
                ['top', 'left', 'bottom', 'right'],
                ['bottom', 'right', 'top', 'left'],
                ['bottom', 'left', 'top', 'right'],
                ['left', 'top', 'right', 'bottom'],
                ['left', 'bottom', 'right', 'top'],
                ['right', 'top', 'left', 'bottom'],
                ['right', 'bottom', 'left', 'top']
            ];
            sequences.push(...patterns);
        }
        
        return sequences;
    }
    
    /**
     * 使用镜像法计算路径
     * 原理：将球桌按照撞库顺序进行镜像，在镜像空间中白球到目标球是直线
     */
    calculatePathWithMirrorMethod(whitePos, redPos, sequence, tableWidth, tableHeight) {
        // 在镜像空间中计算目标球的位置
        let mirroredTarget = { ...redPos };
        
        // 按照撞库序列的逆序进行镜像
        for (let i = sequence.length - 1; i >= 0; i--) {
            mirroredTarget = this.mirrorPoint(mirroredTarget, sequence[i], tableWidth, tableHeight);
        }
        
        // 在镜像空间中，从白球到镜像目标球画一条直线
        // 这条直线与各个库边的交点，就是实际的反弹点
        const path = {
            points: [{ ...whitePos }],
            bouncePoints: [],
            angles: []
        };
        
        let currentPos = { ...whitePos };
        let targetPos = { ...mirroredTarget };
        
        // 计算直线方向
        const direction = this.normalize({
            x: targetPos.x - currentPos.x,
            y: targetPos.y - currentPos.y
        });
        
        // 按照撞库序列计算每个反弹点
        for (let i = 0; i < sequence.length; i++) {
            const side = sequence[i];
            
            // 计算与该库边的交点
            const intersection = this.rayWallIntersection(currentPos, direction, side, tableWidth, tableHeight);
            
            if (!intersection) {
                return null; // 无法到达该库边
            }
            
            // 检查交点是否在合理范围内
            if (!this.isValidBouncePoint(intersection, side, tableWidth, tableHeight)) {
                return null;
            }
            
            // 检查是否会掉袋
            if (this.isNearPocket(intersection, tableWidth, tableHeight)) {
                return null;
            }
            
            // 计算入射角
            const incidentAngle = this.calculateIncidentAngle(direction, side);
            
            // 添加反弹点
            path.points.push({ ...intersection });
            path.bouncePoints.push({
                point: { ...intersection },
                side: side,
                angle: incidentAngle
            });
            path.angles.push(incidentAngle);
            
            // 更新当前位置
            currentPos = { ...intersection };
            
            // 将目标位置镜像回来（撤销一次镜像）
            targetPos = this.mirrorPoint(targetPos, side, tableWidth, tableHeight);
            
            // 重新计算方向
            direction.x = targetPos.x - currentPos.x;
            direction.y = targetPos.y - currentPos.y;
            const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= len;
            direction.y /= len;
        }
        
        // 最后一段：从最后一个反弹点到目标球
        path.points.push({ ...redPos });
        
        return path;
    }
    
    /**
     * 镜像点相对于某个库边
     */
    mirrorPoint(point, side, tableWidth, tableHeight) {
        const mirrored = { ...point };
        
        switch(side) {
            case 'top':
                mirrored.y = -point.y;
                break;
            case 'bottom':
                mirrored.y = 2 * tableHeight - point.y;
                break;
            case 'left':
                mirrored.x = -point.x;
                break;
            case 'right':
                mirrored.x = 2 * tableWidth - point.x;
                break;
        }
        
        return mirrored;
    }
    
    /**
     * 归一化向量
     */
    normalize(vec) {
        const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: vec.x / len, y: vec.y / len };
    }
    
    /**
     * 射线与墙壁的交点
     */
    rayWallIntersection(pos, dir, side, tableWidth, tableHeight) {
        let t;
        let intersection;
        
        switch(side) {
            case 'top':
                if (Math.abs(dir.y) < 0.001) return null;
                t = (0 - pos.y) / dir.y;
                if (t <= 0) return null;
                intersection = {
                    x: pos.x + t * dir.x,
                    y: 0
                };
                break;
            case 'bottom':
                if (Math.abs(dir.y) < 0.001) return null;
                t = (tableHeight - pos.y) / dir.y;
                if (t <= 0) return null;
                intersection = {
                    x: pos.x + t * dir.x,
                    y: tableHeight
                };
                break;
            case 'left':
                if (Math.abs(dir.x) < 0.001) return null;
                t = (0 - pos.x) / dir.x;
                if (t <= 0) return null;
                intersection = {
                    x: 0,
                    y: pos.y + t * dir.y
                };
                break;
            case 'right':
                if (Math.abs(dir.x) < 0.001) return null;
                t = (tableWidth - pos.x) / dir.x;
                if (t <= 0) return null;
                intersection = {
                    x: tableWidth,
                    y: pos.y + t * dir.y
                };
                break;
            default:
                return null;
        }
        
        return intersection;
    }
    
    /**
     * 检查反弹点是否有效
     */
    isValidBouncePoint(point, side, tableWidth, tableHeight) {
        const margin = 5; // 边缘余量
        
        switch(side) {
            case 'top':
            case 'bottom':
                return point.x >= margin && point.x <= tableWidth - margin;
            case 'left':
            case 'right':
                return point.y >= margin && point.y <= tableHeight - margin;
        }
        
        return true;
    }
    
    /**
     * 计算入射角（相对于法线，单位：度）
     */
    calculateIncidentAngle(dir, side) {
        let angle;
        
        switch(side) {
            case 'top':
            case 'bottom':
                // 法线垂直，计算与垂直方向的夹角
                angle = Math.abs(Math.atan2(dir.x, Math.abs(dir.y))) * 180 / Math.PI;
                break;
            case 'left':
            case 'right':
                // 法线水平，计算与水平方向的夹角
                angle = Math.abs(Math.atan2(dir.y, Math.abs(dir.x))) * 180 / Math.PI;
                break;
        }
        
        return angle;
    }
    
    /**
     * 检查点是否靠近球袋
     */
    isNearPocket(point, tableWidth, tableHeight) {
        const threshold = Math.min(tableWidth, tableHeight) * 0.04; // 球袋影响范围
        
        for (const pocket of this.pockets) {
            const px = pocket.x * tableWidth;
            const py = pocket.y * tableHeight;
            const dist = Math.sqrt(
                (point.x - px) * (point.x - px) + 
                (point.y - py) * (point.y - py)
            );
            
            if (dist < threshold) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 评估路径质量
     */
    evaluatePath(path, whitePos, redPos, tableWidth, tableHeight) {
        let score = 100;
        
        // 检查是否真的到达了目标球
        const lastPoint = path.points[path.points.length - 1];
        const distToTarget = Math.sqrt(
            (lastPoint.x - redPos.x) * (lastPoint.x - redPos.x) +
            (lastPoint.y - redPos.y) * (lastPoint.y - redPos.y)
        );
        
        if (distToTarget > 5) {
            score -= 100; // 没有到达目标球，严重扣分
        }
        
        // 路径越短越好
        let totalLength = 0;
        for (let i = 0; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i + 1];
            totalLength += Math.sqrt(
                (p2.x - p1.x) * (p2.x - p1.x) +
                (p2.y - p1.y) * (p2.y - p1.y)
            );
        }
        
        const maxLength = (tableWidth + tableHeight) * (path.bouncePoints.length + 1);
        const lengthRatio = totalLength / maxLength;
        score -= lengthRatio * 30;
        
        // 避免极端角度（太小或太大的入射角）
        for (const angle of path.angles) {
            if (angle < 15) {
                score -= 15; // 角度太小
            } else if (angle > 75) {
                score -= 10; // 角度太大
            }
        }
        
        // 检查反弹点是否过于靠近球袋
        for (const bounce of path.bouncePoints) {
            if (this.isNearPocket(bounce.point, tableWidth, tableHeight)) {
                score -= 50; // 靠近球袋，扣分
            }
        }
        
        // 检查反弹点之间的距离（避免过于密集）
        for (let i = 0; i < path.bouncePoints.length - 1; i++) {
            const p1 = path.bouncePoints[i].point;
            const p2 = path.bouncePoints[i + 1].point;
            const dist = Math.sqrt(
                (p2.x - p1.x) * (p2.x - p1.x) +
                (p2.y - p1.y) * (p2.y - p1.y)
            );
            
            const minDist = Math.min(tableWidth, tableHeight) * 0.2;
            if (dist < minDist) {
                score -= 10; // 反弹点过于密集
            }
        }
        
        return score;
    }
    
    /**
     * 检查路径是否与障碍球相交
     */
    pathIntersectsObstacles(pathPoints, obstacleBalls) {
        if (!obstacleBalls || obstacleBalls.length === 0) {
            return false;
        }
        
        const obstacleRadius = this.ballRadius; // 障碍球半径
        const safeDistance = obstacleRadius * 2.2; // 安全距离（两个球的直径加一点余量）
        
        // 检查路径的每一段是否与障碍球相交
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            
            for (const obstacle of obstacleBalls) {
                // 计算点到线段的最短距离
                const dist = this.pointToSegmentDistance(obstacle, p1, p2);
                
                if (dist < safeDistance) {
                    return true; // 路径与障碍球相交
                }
            }
        }
        
        return false;
    }
    
    /**
     * 计算点到线段的最短距离
     */
    pointToSegmentDistance(point, segStart, segEnd) {
        const dx = segEnd.x - segStart.x;
        const dy = segEnd.y - segStart.y;
        
        // 线段长度的平方
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            // 线段退化为点
            const distX = point.x - segStart.x;
            const distY = point.y - segStart.y;
            return Math.sqrt(distX * distX + distY * distY);
        }
        
        // 计算投影参数 t
        let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t)); // 限制在 [0, 1] 范围内
        
        // 计算投影点
        const projX = segStart.x + t * dx;
        const projY = segStart.y + t * dy;
        
        // 计算点到投影点的距离
        const distX = point.x - projX;
        const distY = point.y - projY;
        
        return Math.sqrt(distX * distX + distY * distY);
    }
    
    /**
     * 检查路径是否与袋口相交
     */
    pathIntersectsPockets(pathPoints, tableWidth, tableHeight) {
        if (!pathPoints || pathPoints.length < 2) {
            return false;
        }
        
        // 袋口的安全距离（球半径 + 一点余量）
        const pocketSafeDistance = Math.min(tableWidth, tableHeight) * 0.035;
        
        // 检查路径的每一段是否与袋口相交
        for (let i = 0; i < pathPoints.length - 1; i++) {
            const p1 = pathPoints[i];
            const p2 = pathPoints[i + 1];
            
            for (const pocket of this.pockets) {
                const pocketX = pocket.x * tableWidth;
                const pocketY = pocket.y * tableHeight;
                const pocketPos = { x: pocketX, y: pocketY };
                
                // 计算袋口到线段的最短距离
                const dist = this.pointToSegmentDistance(pocketPos, p1, p2);
                
                if (dist < pocketSafeDistance) {
                    return true; // 路径与袋口相交
                }
            }
        }
        
        return false;
    }
    
    /**
     * 计算基于方向的6库路径
     * @param {Object} startPos 起始位置（白球位置）
     * @param {number} direction 发射角度（度数，0度为向右，逆时针增加）
     * @param {number} tableWidth 球桌宽度
     * @param {number} tableHeight 球桌高度
     */
    calculateDirectionalPath(startPos, direction, tableWidth, tableHeight) {
        // 将角度转换为弧度
        const angleRad = (direction * Math.PI) / 180;
        
        // 计算方向向量
        const dirVector = {
            x: Math.cos(angleRad),
            y: -Math.sin(angleRad) // 注意：canvas的y轴向下为正，所以取负
        };
        
        const path = {
            points: [{ ...startPos }],
            bouncePoints: [],
            angles: [],
            direction: direction
        };
        
        let currentPos = { ...startPos };
        let currentDir = { ...dirVector };
        let bounceCount = 0;
        const maxBounces = 6;
        
        // 模拟球的运动，直到撞击6次库边
        while (bounceCount < maxBounces) {
            // 找到下一个碰撞点
            const collision = this.findNextCollision(currentPos, currentDir, tableWidth, tableHeight);
            
            if (!collision) {
                // 无法找到碰撞点，路径无效
                return null;
            }
            
            // 检查是否会掉袋
            if (this.isNearPocket(collision.point, tableWidth, tableHeight)) {
                // 如果碰撞点靠近球袋，尝试微调方向
                // 这里简单处理：如果前几次碰撞就掉袋，返回null
                if (bounceCount < 3) {
                    return null;
                }
            }
            
            // 添加碰撞点
            path.points.push({ ...collision.point });
            
            // 计算入射角
            const incidentAngle = this.calculateIncidentAngle(currentDir, collision.side);
            
            path.bouncePoints.push({
                point: { ...collision.point },
                side: collision.side,
                angle: incidentAngle
            });
            path.angles.push(incidentAngle);
            
            // 更新当前位置和方向（反射）
            currentPos = { ...collision.point };
            currentDir = this.reflectDirection(currentDir, collision.side);
            
            bounceCount++;
        }
        
        return path;
    }
    
    /**
     * 找到射线与球桌边界的下一个碰撞点
     */
    findNextCollision(pos, dir, tableWidth, tableHeight) {
        const collisions = [];
        
        // 检查与四个边界的碰撞
        const sides = ['top', 'bottom', 'left', 'right'];
        
        for (const side of sides) {
            const intersection = this.rayWallIntersection(pos, dir, side, tableWidth, tableHeight);
            
            if (intersection) {
                // 计算距离
                const dx = intersection.x - pos.x;
                const dy = intersection.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 确保交点在有效范围内
                if (distance > 0.1 && this.isValidBouncePoint(intersection, side, tableWidth, tableHeight)) {
                    collisions.push({
                        point: intersection,
                        side: side,
                        distance: distance
                    });
                }
            }
        }
        
        // 返回最近的碰撞点
        if (collisions.length === 0) {
            return null;
        }
        
        collisions.sort((a, b) => a.distance - b.distance);
        return collisions[0];
    }
    
    /**
     * 反射方向向量
     */
    reflectDirection(dir, side) {
        const reflected = { ...dir };
        
        switch(side) {
            case 'top':
            case 'bottom':
                // 垂直边界：y方向反转
                reflected.y = -reflected.y;
                break;
            case 'left':
            case 'right':
                // 水平边界：x方向反转
                reflected.x = -reflected.x;
                break;
        }
        
        return reflected;
    }
}
