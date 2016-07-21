angular.module("directive.maze", [])

.constant("CONFIG", {
    animationSpeed: 8,
    textOffsetX: -10,
    pathsColor: "#424242",
    shortestPathColor: "#64dd17",
    locationColor: "#2196f3",
    LEFT_ARROW: 37,
    RIGHT_ARROW: 39,
    UP_ARROW: 38,
    DOWN_ARROW: 40
})

.directive("maze", function($parse, $sce, $timeout, $uibModal, CONFIG) {
    return {
        restrict: "A",
        templateUrl: 'maze.html',
        scope: {},
        link: function($scope, element, attrs) {

            window.requestAnimFrame = (function(){
                return  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
                function(/* function */ callback, /* DOMElement */ element){
                  window.setTimeout(callback, 1000 / 60);
                };
            })();

            $scope.shortestPath = [];
            $scope.allPoints = [];
            var pathLength = 48;
            var increment = 50;
            var startPoint = {
                    id: "1",
                    connect: {
                        // "1": 0,
                    },
                    x: 500,
                    y: 500
            };
            var prevPos = startPoint;
            var prevRandom = -1;

            var possibleMoves = [
                moveUp,
                moveDown,
                moveLeft,
                moveRight
            ];
            var lastId;
            var destinationId;
            var currentLocationId = "1";

            function moveUp(prevPos) {
                return {
                    x: prevPos.x,
                    y: prevPos.y - increment
                }
            }

            function moveDown(prevPos) {
                return {
                    x: prevPos.x,
                    y: prevPos.y + increment
                }
            }

            function moveLeft(prevPos) {
                return {
                    x: prevPos.x - increment,
                    y: prevPos.y
                }
            }

            function moveRight(prevPos) {
                return {
                    x: prevPos.x + increment,
                    y: prevPos.y
                }
            }


            $scope.points = [];
            $scope.tempPoints = [];

            $scope.tempPoints.push(startPoint);
            $scope.allPoints[500] = [];
            $scope.allPoints[500][500] = "1";

            function isDeadEnd(prevPos) {
                return !!($scope.allPoints[prevPos.x][prevPos.y - increment] && $scope.allPoints[prevPos.x][prevPos.y + increment]
                    && $scope.allPoints[prevPos.x - increment] && $scope.allPoints[prevPos.x - increment][prevPos.y]
                    && $scope.allPoints[prevPos.x + increment] && $scope.allPoints[prevPos.x + increment][prevPos.y]);
            }

            for (var x = 0; x < pathLength; x++) {
                var newPos;
                var done = false;
                var prevId = prevPos.id;
                var newId = (parseInt(prevPos.id) + 1).toString();
                var isImpossible = isDeadEnd(prevPos);

                if (isImpossible) {
                    _.each($scope.tempPoints, function(point) {
                        if (point.id === prevId) {
                            point.name = "Princess Amir!!";
                            destinationId = point.id;
                        }
                    });
                    break;
                }

                while(!done) {
                    var random = Math.floor((Math.random() * 4));

                    while(random === prevRandom) {
                        random = Math.floor((Math.random() * 4));
                    }

                    newPos = possibleMoves[random](prevPos);

                    if (!$scope.allPoints[newPos.x]) {
                        done = true;
                        $scope.allPoints[newPos.x] = [];
                        $scope.allPoints[newPos.x][newPos.y] = newId;
                        prevRandom = random;
                    } else if (!$scope.allPoints[newPos.x][newPos.y]) {
                        $scope.allPoints[newPos.x][newPos.y] = newId;
                        done = true;
                        prevRandom = random;
                    }
                }

                prevPos = newPos;
                prevPos.id = newId;
                lastId = newId;
                prevPos.connect = {};
                prevPos.connect[prevId] = 1;

                var preLocation = _.find($scope.tempPoints, function(point) {
                    return point.id === prevId;
                });
                preLocation.connect[newId] = 1;

                if (x === pathLength - 1) {
                    prevPos.name = "Princess Amir!!";
                    destinationId = newId;
                }

                $scope.tempPoints.push(prevPos);

            }

            $scope.points = angular.copy($scope.tempPoints);

            _.each($scope.points, function(point, idx) {
                if (idx === 0) {
                    return;
                }
                if (idx < pathLength) {
                    if (isDeadEnd(point)) {
                        return;
                    }
                    prevRandom = -1;
                    prevPos = point;
                    for (var x = 0; x < pathLength; x++) {
                        var newPos;
                        var done = false;
                        var prevId = prevPos.id;
                        var newId = (parseInt(lastId) + 1).toString();
                        var isImpossible = isDeadEnd(prevPos);
                        if (isImpossible) {
                            break;
                        }

                        while(!done) {
                            var random = Math.floor((Math.random() * 4));

                            // while(random === prevRandom) {
                                random = Math.floor((Math.random() * 4));
                            // }

                            newPos = possibleMoves[random](prevPos);

                            if (!$scope.allPoints[newPos.x]) {
                                done = true;
                                $scope.allPoints[newPos.x] = [];
                                $scope.allPoints[newPos.x][newPos.y] = newId;
                                prevRandom = random;
                            } else if (!$scope.allPoints[newPos.x][newPos.y]) {
                                $scope.allPoints[newPos.x][newPos.y] = newId;
                                done = true;
                                prevRandom = random;
                            }
                        }

                        prevPos = newPos;
                        prevPos.id = newId;
                        lastId = newId;
                        prevPos.connect = {};
                        prevPos.connect[prevId] = 1;

                        var preLocation = _.find($scope.tempPoints, function(point) {
                            return point.id === prevId;
                        });
                        preLocation.connect[newId] = 1;

                        $scope.tempPoints.push(prevPos);
                    }
                }
            });

            $scope.points = angular.copy($scope.tempPoints);

            var c = document.getElementById("myCanvas");
            var myCanvas = angular.element(c);
            var onMousePress = false;
            var ctx = c.getContext("2d");
            var currentOffsetX = 0;
            var currentOffsetY = 0;
            var offsetX = 0;
            var offsetY = 0;
            var isMoved = false;
            var g, originalClientX, originalClientY;

            window.onresize = function() {
                resizeCanvas();
                drawMap(currentOffsetX, currentOffsetY);
                redoPath($scope.shortestPath, CONFIG.shortestPathColor, currentOffsetX, currentOffsetY);
            };

            document.addEventListener("keydown", handleKeydown);

            function handleKeydown(evt) {
                var currentLocation = _.find($scope.points, function(point) {
                        return point.id === currentLocationId;
                    });
                if (evt.keyCode === CONFIG.UP_ARROW) {
                    evt.preventDefault();
                    if ($scope.allPoints[currentLocation.x][currentLocation.y - increment] && currentLocation.connect[$scope.allPoints[currentLocation.x][currentLocation.y - increment]]) {
                        currentOffsetX = currentOffsetX;
                        currentOffsetY = currentOffsetY + increment;
                        currentLocationId = $scope.allPoints[currentLocation.x][currentLocation.y - increment];
                        if (currentLocationId === destinationId) {
                            alert("YAY!! YOU RESCUE THE PRINCESS AMIR!!!!")
                        }
                        ctx.clearRect(0, 0, c.width, c.height);
                        drawMap(currentOffsetX, currentOffsetY);
                    }


                } else if (evt.keyCode === CONFIG.DOWN_ARROW) {
                    evt.preventDefault();
                    if ($scope.allPoints[currentLocation.x][currentLocation.y + increment] && currentLocation.connect[$scope.allPoints[currentLocation.x][currentLocation.y + increment]]) {
                        currentOffsetX = currentOffsetX;
                        currentOffsetY = currentOffsetY - increment;
                        currentLocationId = $scope.allPoints[currentLocation.x][currentLocation.y + increment];
                        if (currentLocationId === destinationId) {
                            alert("YAY!! YOU RESCUE THE PRINCESS AMIR!!!!")
                        }
                        ctx.clearRect(0, 0, c.width, c.height);
                        drawMap(currentOffsetX, currentOffsetY);
                    }
                } else if (evt.keyCode === CONFIG.LEFT_ARROW) {
                    evt.preventDefault();

                    if ($scope.allPoints[currentLocation.x - increment][currentLocation.y] && currentLocation.connect[$scope.allPoints[currentLocation.x - increment][currentLocation.y]]) {
                        currentOffsetX = currentOffsetX + increment;
                        currentOffsetY = currentOffsetY;
                        currentLocationId = $scope.allPoints[currentLocation.x - increment][currentLocation.y];
                        if (currentLocationId === destinationId) {
                            alert("YAY!! YOU RESCUE THE PRINCESS AMIR!!!!")
                        }
                        ctx.clearRect(0, 0, c.width, c.height);
                        drawMap(currentOffsetX, currentOffsetY);
                    }
                } else if (evt.keyCode === CONFIG.RIGHT_ARROW) {
                    evt.preventDefault();
                    if ($scope.allPoints[currentLocation.x + increment][currentLocation.y] && currentLocation.connect[$scope.allPoints[currentLocation.x + increment][currentLocation.y]]) {
                        currentOffsetX = currentOffsetX - increment;
                        currentOffsetY = currentOffsetY;
                        currentLocationId = $scope.allPoints[currentLocation.x + increment][currentLocation.y];
                        if (currentLocationId === destinationId) {
                            alert("YAY!! YOU RESCUE THE PRINCESS AMIR!!!!")
                        }
                        ctx.clearRect(0, 0, c.width, c.height);
                        drawMap(currentOffsetX, currentOffsetY);
                    }
                }
            }

            myCanvas.on("mousedown", function(e) {
                onMousePress = true;
                originalClientX = e.clientX;
                originalClientY = e.clientY;
            });
            myCanvas.on("mouseup", function() {
                myCanvas.removeClass('move');

                if (isMoved) {
                    currentOffsetX += offsetX;
                    currentOffsetY += offsetY;
                    isMoved = false;
                }

                onMousePress = false;
            });
            myCanvas.on("mousemove", function(e) {
                if (onMousePress) {
                    isMoved = true;
                    myCanvas.addClass('move');

                    offsetX = e.clientX - originalClientX;
                    offsetY = e.clientY - originalClientY;

                    ctx.clearRect(0, 0, c.width, c.height);
                    drawMap(offsetX + currentOffsetX, offsetY + currentOffsetY);
                    redoPath($scope.shortestPath, CONFIG.shortestPathColor, offsetX + currentOffsetX, offsetY + currentOffsetY);
                }
            });

            function resizeCanvas() {
                c.width = window.innerWidth;
                c.height = window.innerHeight;
            }

            resizeCanvas();

            function drawMap(offsetX, offsetY) {
                // g = new Graph();
                offsetX = offsetX || 0;
                offsetY = offsetY || 0;

                ctx.lineWidth = 2;
                ctx.strokeStyle = CONFIG.locationColor;
                ctx.font = "15px Arial";
                ctx.beginPath();
                var newCounter = 0;
                var lines = {}

                _.each($scope.points, function(point) {
                    _.each(point.connect, function(distances, connectPoint) {
                        var tempPoint = _.find($scope.points, function(point) {
                            return point.id === connectPoint;
                        });

                        point.connect[connectPoint] = Math.sqrt(Math.pow(Math.abs(point.x - tempPoint.x), 2) + Math.pow(Math.abs(point.y - tempPoint.y), 2));

                        var line1 = point.id + tempPoint.id;
                        var line2 = tempPoint.id + point.id;

                        if (!lines[line1] && !lines[line2]) {
                            newCounter ++;

                            ctx.moveTo(point.x + offsetX, point.y + offsetY);
                            ctx.lineTo(tempPoint.x + offsetX, tempPoint.y + offsetY);
                            lines[line1] = true;
                            lines[line2] = true;
                        }
                    });

                    // g.addVertex(point.id, point.connect);
                    // draw Name
                    if (point.name)
                    ctx.fillText(point.name, point.x + offsetX + CONFIG.textOffsetX, point.y + offsetY - 10);

                    if (point.id === currentLocationId)
                    ctx.fillText("You", point.x + offsetX + CONFIG.textOffsetX, point.y + offsetY - 10);
                    // draw dot
                    ctx.moveTo(point.x + offsetX, point.y + offsetY);
                    // ctx.strokeStyle = CONFIG.locationColor;

                    if (point.id === currentLocationId || point.id === destinationId) {
                        ctx.arc(point.x + offsetX, point.y + offsetY, 10, 0, 2 * Math.PI);
                    } else {
                        ctx.arc(point.x + offsetX, point.y + offsetY, 2, 0, 2 * Math.PI);
                    }
                    ctx.fillStyle = CONFIG.locationColor;
                    ctx.fill();
                });

                ctx.stroke();
                ctx.closePath();
            }

            drawMap();
                    // ctx.clearRect(0, 0, c.width, c.height);

            function drawAnimateLine(remainPaths, currentPath, nextPath, distance) {
                var tan = Math.abs(currentPath.x - nextPath.x)/Math.abs(currentPath.y - nextPath.y);

                // need to find the next point along the line to make animation
                var nextPoint = {};

                if (currentPath.x === nextPath.x) {
                    nextPoint.x = currentPath.x;
                } else if (currentPath.x > nextPath.x) {

                    if (currentPath.x - distance > nextPath.x) {
                        nextPoint.x = currentPath.x - distance;
                    } else {
                        nextPoint.x = nextPath.x;
                    }
                } else if (currentPath.x < nextPath.x) {
                    if (currentPath.x + distance < nextPath.x) {
                        nextPoint.x = currentPath.x + distance;
                    } else {
                        nextPoint.x = nextPath.x;
                    }
                }

                if (currentPath.y > nextPath.y) {
                    if(tan) {
                        nextPoint.y = currentPath.y - distance/tan;
                    } else {
                        nextPoint.y = currentPath.y - distance;
                    }

                    if (nextPoint.y < nextPath.y) {
                        nextPoint.y = nextPath.y;
                    }

                } else if (currentPath.y < nextPath.y) {
                    if(tan) {
                        nextPoint.y = distance/tan + currentPath.y;
                    } else {
                        nextPoint.y = distance + currentPath.y;
                    }

                    if (nextPoint.y > nextPath.y) {
                        nextPoint.y = nextPath.y;
                    }
                } else if (currentPath.y === nextPath.y) {
                    nextPoint.y = currentPath.y;
                }

                ctx.beginPath();
                ctx.strokeStyle = CONFIG.shortestPathColor;
                ctx.moveTo(currentPath.x + currentOffsetX, currentPath.y + currentOffsetY);
                ctx.lineTo(nextPoint.x + currentOffsetX, nextPoint.y + currentOffsetY);
                ctx.stroke();
                ctx.closePath();

                if (nextPoint.x !== nextPath.x || nextPoint.y !== nextPath.y) {
                    requestAnimationFrame(function () {
                        drawAnimateLine(remainPaths, nextPoint, nextPath, distance);
                    });
                } else {
                    if (remainPaths.length > 1) {
                        drawPath(remainPaths);
                    }
                }
            }

            // FIX ME: need better way to clear old path
            function redoPath(paths, color, offsetX, offsetY) {
                var numberOfPoints = paths.length;
                offsetX = offsetX || 0;
                offsetY = offsetY || 0;

                _.each(paths, function(path, idx) {
                    var currentPath = _.find($scope.points, function(point) {
                        return path === point.id;
                    });

                    if (idx < numberOfPoints - 1) {
                        var nextPath = _.find($scope.points, function(point) {
                            return point.id === paths[idx + 1];
                        });

                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.moveTo(currentPath.x + offsetX, currentPath.y + offsetY);
                        ctx.lineTo(nextPath.x + offsetX, nextPath.y + offsetY);
                        ctx.stroke();
                        ctx.closePath();
                    }
                });
            };

            function drawPath(paths) {
                var currentPath = _.find($scope.points, function(point) {
                    return paths[0] === point.id;
                });

                var nextPath = _.find($scope.points, function(point) {
                    return point.id === paths[1];
                });

                paths.shift();

                drawAnimateLine(paths, currentPath, nextPath, CONFIG.animationSpeed);
            };
        }
    }
});