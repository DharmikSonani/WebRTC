import { Animated, StyleSheet } from 'react-native'
import React, { memo, useState } from 'react'
import { useDraggableXY } from '../hooks/draggableXY';

const DraggableView = ({
    style,
    x,
    y,
    children,
    bounceHorizontal,
    bounceVertical,
    border = 0,
    disabled,
    duration,
}) => {

    const [objectDimensions, setObjectDimensions] = useState({
        width: 0,
        height: 0,
    });

    const { drag, panResponder } = useDraggableXY({
        disabled: disabled,
        draggableMaxAreaX: x ? x - objectDimensions.width - border * 2 : 0,
        draggableMaxAreaY: y ? y - objectDimensions.height - border * 2 : 0,
        bounceHorizontal: bounceHorizontal,
        bounceVertical: bounceVertical,
        duration: duration,
    });

    return (
        <Animated.View
            style={[
                styles.Container,
                style && style,
                { transform: drag.getTranslateTransform() }
            ]}
            onLayout={(layout) => {
                objectDimensions.width == 0 && objectDimensions.height == 0 && setObjectDimensions({
                    width: layout.nativeEvent.layout.width,
                    height: layout.nativeEvent.layout.height
                })
            }}
            {...panResponder.panHandlers}
        >
            {children}
        </Animated.View>
    )
}

export default memo(DraggableView)

const styles = StyleSheet.create({
    Container: {
        alignSelf: 'flex-start',
        zIndex: 100,
    },
});