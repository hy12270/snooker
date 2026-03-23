export class PathCalculator {
    constructor() {
        // 斯诺克球直径为52.5mm，这里使用像素表示
        this.ballRadius = 11; // 半径11像素（直径22px）
        
        // 球袋位置（相对于球桌的比例）
        // 横向球桌：中袋在上下
        this.pocketsHorizontal = [
            { x: 0, y: 0, radius: 0.03 },
            { x: 1, y: 0, radius: 0.03 },
            { x: 0.5, y: 0, radius: 0.025 },
            { x: 0.5, y: 1, radius: 0.025 },
            { x: 0, y: 1, radius: 0.03 },
            { x: 1, y: 1, radius: 0.03 }
        ];
        // 竖向球桌：中袋在左右
        this.pocketsVertical = [
            { x: 0, y: 0, radius: 0.03 },
            { x: 1, y: 0, radius: 0.03 },
            { x: 0, y: 0.5, radius: 0.025 },
            { x: 1, y: 0.5, radius: 0.025 },
            { x: 0, y: 1, radius: 0.03 },
            { x: 1, y: 1, radius: 0.03 }
        ];
    }

    /**
     * 获取当前球袋位置（根据球桌方向）
     */
    getPockets(tableWidth, tableHeight) {
        const isVertical = tableHeight > tableWidth * 1.3;
        return isVertical ? this.pocketsVertical : this.pocketsHorizontal;
    }
    
    /**
     * 计算路径 - 主入口
     */
    calculatePath(whitePos, redPos, cushionCount, tableWidth, tableHeight, 
                  obstacleBalls = [], directionMode = false, direction = 0) {
        
        // 方向模式：从白球点位按指定方向发射，计算6库路径
        if (directionMode && cushionCount === 6) {
            return this.calculateDirectionalPath(whitePos, direction, tableWidth, tableHeight);
        }
        
        if (cushionCount === 0) {
            const directPath = this.calculateDirectPath(whitePos, redPos);
            if (this.pathIntersectsObstacles(directPath.points, obstacleBalls)) {
                return null;
            }
            if (this.pathIntersectsPockets(directPath.points, tableWidth, tableHeight)) {
                return null;
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
     * 计算撞库路径 - 使用镜像法（入射角=反射角）
     */
    calculateCushionPath(whitePos, redPos, cushionCount, tableWidth, tableHeight, 
                          obstacleBalls = []) {
        const possibleSequences = this.generateCushionSequences(cushionCount);
        
        let bestPath = null;
        let bestScore = -Infinity;
        
        for (const sequence of possibleSequences) {
            const path = this.calculatePathWithMirrorMethod(
                whitePos, redPos, sequence, tableWidth, tableHeight
            );
            
            if (path && path.bouncePoints.length === cushionCount) {
                if (this.pathIntersectsObstacles(path.points, obstacleBalls)) continue;
                if (this.pathIntersectsPockets(path.points, tableWidth, tableHeight)) continue;
                
                if (cushionCount === 1) {
                    const firstSegment = [path.points[0], path.points[1]];
                    const distToRed1 = this.pointToSegmentDistance(redPos, firstSegment[0], firstSegment[1]);
                    if (distToRed1 < this.ballRadius * 2.2) continue;
                    
                    const secondSegment = [path.points[1], path.points[2]];
                    const distToWhite = this.pointToSegmentDistance(whitePos, secondSegment[0], secondSegment[1]);
                    if (distToWhite < this.ballRadius * 2.2) continue;
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
            sides.forEach(s => sequences.push([s]));
        } else if (cushionCount === 2) {
            const patterns = [
                ['top', 'right'], ['top', 'left'],
                ['bottom', 'right'], ['bottom', 'left'],
                ['left', 'top'], ['left', 'bottom'],
                ['right', 'top'], ['right', 'bottom']
            ];
            sequences.push(...patterns);
        } else if (cushionCount === 3) {
            const patterns = [
                ['top', 'right', 'bottom'], ['top', 'left', 'bottom'],
                ['bottom', 'right', 'top'], ['bottom', 'left', 'top'],
                ['left', 'top', 'right'], ['left', 'bottom', 'right'],
                ['right', 'top', 'left'], ['right', 'bottom', 'left'],
                ['top', 'right', 'left'], ['top', 'left', 'right'],
                ['bottom', 'right', 'left'], ['bottom', 'left', 'right'],
                ['left', 'top', 'bottom'], ['left', 'bottom', 'top'],
                ['right', 'top', 'bottom'], ['right', 'bottom', 'top']
            ];
            sequences.push(...patterns);
        } else if (cushionCount === 4) {
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
     * 使用镜像法计算路径（入射角=反射角）
     */
    calculatePathWithMirrorMethod(whitePos, redPos, sequence, tableWidth, tableHeight) {
        let mirroredTarget = { ...redPos };
        
        for (let i = sequence.length - 1; i >= 0; i--) {
            mirroredTarget = this.mirrorPoint(mirroredTarget, sequence[i], tableWidth, tableHeight);
        }
        
        const path = {
            points: [{ ...whitePos }],
            bouncePoints: [],
            angles: []
        };
        
        let currentPos = { ...whitePos };
        let targetPos = { ...mirroredTarget };
        
        const direction = this.normalize({
            x: targetPos.x - currentPos.x,
            y: targetPos.y - currentPos.y
        });
        
        for (let i = 0; i < sequence.length; i++) {
            const side = sequence[i];
            const intersection = this.rayWallIntersection(currentPos, direction, side, tableWidth, tableHeight);
            
            if (!intersection) return null;
            if (!this.isValidBouncePoint(intersection, side, tableWidth, tableHeight)) return null;
            if (this.isNearPocket(intersection, tableWidth, tableHeight)) return null;
            
            const incidentAngle = this.calculateIncidentAngle(direction, side);
            
            path.points.push({ ...intersection });
            path.bouncePoints.push({
                point: { ...intersection },
                side: side,
                angle: incidentAngle,
                incidentAngle: incidentAngle
            });
            path.angles.push(incidentAngle);
            
            currentPos = { ...intersection };
            targetPos = this.mirrorPoint(targetPos, side, tableWidth, tableHeight);
            
            direction.x = targetPos.x - currentPos.x;
            direction.y = targetPos.y - currentPos.y;
            const len = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
            direction.x /= len;
            direction.y /= len;
        }
        
        path.points.push({ ...redPos });
        return path;
    }
    
    mirrorPoint(point, side, tableWidth, tableHeight) {
        const mirrored = { ...point };
        switch(side) {
            case 'top': mirrored.y = -point.y; break;
            case 'bottom': mirrored.y = 2 * tableHeight - point.y; break;
            case 'left': mirrored.x = -point.x; break;
            case 'right': mirrored.x = 2 * tableWidth - point.x; break;
        }
        return mirrored;
    }
    
    normalize(vec) {
        const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: vec.x / len, y: vec.y / len };
    }
    
    rayWallIntersection(pos, dir, side, tableWidth, tableHeight) {
        let t;
        let intersection;
        
        switch(side) {
            case 'top':
                if (Math.abs(dir.y) < 0.001) return null;
                t = (0 - pos.y) / dir.y;
                if (t <= 0) return null;
                intersection = { x: pos.x + t * dir.x, y: 0 };
                break;
            case 'bottom':
                if (Math.abs(dir.y) < 0.001) return null;
                t = (tableHeight - pos.y) / dir.y;
                if (t <= 0) return null;
                intersection = { x: pos.x + t * dir.x, y: tableHeight };
                break;
            case 'left':
                if (Math.abs(dir.x) < 0.001) return null;
                t = (0 - pos.x) / dir.x;
                if (t <= 0) return null;
                intersection = { x: 0, y: pos.y + t * dir.y };
                break;
            case 'right':
                if (Math.abs(dir.x) < 0.001) return null;
                t = (tableWidth - pos.x) / dir.x;
                if (t <= 0) return null;
                intersection = { x: tableWidth, y: pos.y + t * dir.y };
                break;
            default:
                return null;
        }
        
        return intersection;
    }
    
    isValidBouncePoint(point, side, tableWidth, tableHeight) {
        const margin = 5;
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
    
    calculateIncidentAngle(dir, side) {
        let angle;
        switch(side) {
            case 'top':
            case 'bottom':
                angle = Math.abs(Math.atan2(dir.x, Math.abs(dir.y))) * 180 / Math.PI;
                break;
            case 'left':
            case 'right':
                angle = Math.abs(Math.atan2(dir.y, Math.abs(dir.x))) * 180 / Math.PI;
                break;
        }
        return angle;
    }
    
    isNearPocket(point, tableWidth, tableHeight) {
        const threshold = Math.min(tableWidth, tableHeight) * 0.04;
        const pockets = this.getPockets(tableWidth, tableHeight);
        for (const pocket of pockets) {
            const px = pocket.x * tableWidth;
            const py = pocket.y * tableHeight;
            const dist = Math.sqrt((point.x - px) ** 2 + (point.y - py) ** 2);
            if (dist < threshold) return true;
        }
        return false;
    }
    
    evaluatePath(path, whitePos, redPos, tableWidth, tableHeight) {
        let score = 100;
        
        const lastPoint = path.points[path.points.length - 1];
        const distToTarget = Math.sqrt(
            (lastPoint.x - redPos.x) ** 2 + (lastPoint.y - redPos.y) ** 2
        );
        if (distToTarget > 5) score -= 100;
        
        let totalLength = 0;
        for (let i = 0; i < path.points.length - 1; i++) {
            const p1 = path.points[i];
            const p2 = path.points[i + 1];
            totalLength += Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
        }
        
        const maxLength = (tableWidth + tableHeight) * (path.bouncePoints.length + 1);
        score -= (totalLength / maxLength) * 30;
        
        for (const angle of path.angles) {
            if (angle < 15) score -= 15;
            else if (angle > 75) score -= 10;
        }
        
        for (const bounce of path.bouncePoints) {
            if (this.isNearPocket(bounce.point, tableWidth, tableHeight)) score -= 50;
        }
        
        for (let i = 0; i < path.bouncePoints.length - 1; i++) {
            const p1 = path.bouncePoints[i].point;
            const p2 = path.bouncePoints[i + 1].point;
            const dist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            if (dist < Math.min(tableWidth, tableHeight) * 0.2) score -= 10;
        }
        
        return score;
    }
    
    pathIntersectsObstacles(pathPoints, obstacleBalls) {
        if (!obstacleBalls || obstacleBalls.length === 0) return false;
        const safeDistance = this.ballRadius * 2.2;
        
        for (let i = 0; i < pathPoints.length - 1; i++) {
            for (const obstacle of obstacleBalls) {
                const dist = this.pointToSegmentDistance(obstacle, pathPoints[i], pathPoints[i + 1]);
                if (dist < safeDistance) return true;
            }
        }
        return false;
    }
    
    pointToSegmentDistance(point, segStart, segEnd) {
        const dx = segEnd.x - segStart.x;
        const dy = segEnd.y - segStart.y;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            const distX = point.x - segStart.x;
            const distY = point.y - segStart.y;
            return Math.sqrt(distX * distX + distY * distY);
        }
        
        let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        const projX = segStart.x + t * dx;
        const projY = segStart.y + t * dy;
        
        return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
    }
    
    pathIntersectsPockets(pathPoints, tableWidth, tableHeight) {
        if (!pathPoints || pathPoints.length < 2) return false;
        const pocketSafeDistance = Math.min(tableWidth, tableHeight) * 0.035;
        const pockets = this.getPockets(tableWidth, tableHeight);
        
        for (let i = 0; i < pathPoints.length - 1; i++) {
            for (const pocket of pockets) {
                const pocketPos = { x: pocket.x * tableWidth, y: pocket.y * tableHeight };
                const dist = this.pointToSegmentDistance(pocketPos, pathPoints[i], pathPoints[i + 1]);
                if (dist < pocketSafeDistance) return true;
            }
        }
        return false;
    }
    
    /**
     * 计算基于方向的6库路径（理想反弹：入射角=反射角）
     */
    calculateDirectionalPath(startPos, direction, tableWidth, tableHeight) {
        const angleRad = (direction * Math.PI) / 180;
        const dirVector = {
            x: Math.cos(angleRad),
            y: -Math.sin(angleRad) // canvas y轴向下
        };
        
        const path = {
            points: [{ ...startPos }],
            bouncePoints: [],
            angles: [],
            direction: direction
        };
        
        let currentPos = { ...startPos };
        let currentDir = { ...dirVector };
        const maxBounces = 6;
        
        for (let bounceCount = 0; bounceCount < maxBounces; bounceCount++) {
            const collision = this.findNextCollision(currentPos, currentDir, tableWidth, tableHeight);
            if (!collision) return null;
            
            if (this.isNearPocket(collision.point, tableWidth, tableHeight) && bounceCount < 3) {
                return null;
            }
            
            path.points.push({ ...collision.point });
            
            const incidentAngle = this.calculateIncidentAngle(currentDir, collision.side);
            
            path.bouncePoints.push({
                point: { ...collision.point },
                side: collision.side,
                angle: incidentAngle,
                incidentAngle: incidentAngle
            });
            path.angles.push(incidentAngle);
            
            currentPos = { ...collision.point };
            currentDir = this.reflectDirection(currentDir, collision.side);
        }
        
        return path;
    }
    
    findNextCollision(pos, dir, tableWidth, tableHeight) {
        const collisions = [];
        const sides = ['top', 'bottom', 'left', 'right'];
        
        for (const side of sides) {
            const intersection = this.rayWallIntersection(pos, dir, side, tableWidth, tableHeight);
            if (intersection) {
                const dx = intersection.x - pos.x;
                const dy = intersection.y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0.1 && this.isValidBouncePoint(intersection, side, tableWidth, tableHeight)) {
                    collisions.push({ point: intersection, side, distance });
                }
            }
        }
        
        if (collisions.length === 0) return null;
        collisions.sort((a, b) => a.distance - b.distance);
        return collisions[0];
    }
    
    reflectDirection(dir, side) {
        const reflected = { ...dir };
        switch(side) {
            case 'top':
            case 'bottom':
                reflected.y = -reflected.y;
                break;
            case 'left':
            case 'right':
                reflected.x = -reflected.x;
                break;
        }
        return reflected;
    }
}