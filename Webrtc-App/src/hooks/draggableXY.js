import { useRef } from "react";
import { Animated, PanResponder } from "react-native";

const defaultDuration = 250;

export const useDraggableXY = ({
    disabled,
    draggableMaxAreaX = 0, // draggableMaxAreaX = Total Width - Component Width (Include Padding / Margin) 
    draggableMaxAreaY = 0, // draggableMaxAreaY = Total Height - Component Height (Include Padding / Margin) 
    bounceHorizontal,
    bounceVertical,
    duration,
}) => {

    const drag = useRef(new Animated.ValueXY()).current;
    const initialPositionX = useRef(0);
    const initialPositionY = useRef(0);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
            initialPositionX.current = drag.x._value;
            initialPositionY.current = drag.y._value;
        },
        onPanResponderMove: (_, { dx, dy }) => {
            const newPositionX = initialPositionX.current + dx;
            const newPositionY = initialPositionY.current + dy;
            newPositionX >= 0 &&
                newPositionX <= draggableMaxAreaX &&
                newPositionY >= 0 &&
                newPositionY <= draggableMaxAreaY &&
                drag.setValue({ x: newPositionX, y: newPositionY });
        },
        onPanResponderRelease: (_, { dx, dy }) => {
            const newPositionX = initialPositionX.current + dx;
            const newPositionY = initialPositionY.current + dy;

            if (bounceHorizontal && bounceVertical) {
                if (newPositionX >= draggableMaxAreaX / 2 && newPositionY >= draggableMaxAreaY / 2) {
                    animateObjectPosition({ x: draggableMaxAreaX, y: draggableMaxAreaY })
                } else if (newPositionX >= draggableMaxAreaX / 2 && newPositionY < draggableMaxAreaY / 2) {
                    animateObjectPosition({ x: draggableMaxAreaX })
                } else if (newPositionX < draggableMaxAreaX / 2 && newPositionY >= draggableMaxAreaY / 2) {
                    animateObjectPosition({ y: draggableMaxAreaY })
                } else {
                    animateObjectPosition({});
                }
            } else if (bounceHorizontal && !bounceVertical) {
                if (newPositionX >= draggableMaxAreaX / 2) {
                    animateObjectPosition({ x: draggableMaxAreaX, y: drag.y._value })
                } else {
                    drag.y._value >= 0 && drag.y._value <= draggableMaxAreaY && animateObjectPosition({ y: drag.y._value });
                }
            } else if (!bounceHorizontal && bounceVertical) {
                if (newPositionY >= draggableMaxAreaY / 2) {
                    animateObjectPosition({ x: drag.x._value, y: draggableMaxAreaY })
                } else {
                    drag.x._value >= 0 && drag.x._value <= draggableMaxAreaX && animateObjectPosition({ x: drag.x._value });
                }
            }
        },
    });

    const animateObjectPosition = ({ x = 0, y = 0 }) => {
        Animated.timing(drag, {
            toValue: { x: x, y: y },
            useNativeDriver: true,
            duration: duration ?? defaultDuration,
        }).start();
    }

    return {
        drag,
        panResponder,
    }
}