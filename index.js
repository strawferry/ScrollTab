const React = require('react');
const ReactNative = require('react-native');
const {
    View,
    Animated,
    StyleSheet,
    ScrollView,
    Text,
    Platform,
    Dimensions,
    I18nManager,
    TouchableOpacity
} = ReactNative;
const Button = (props) => {
    return <TouchableOpacity {...props}>
        {props.children}
    </TouchableOpacity>;
};

const WINDOW_WIDTH = Dimensions.get('window').width;

const ScrollTab = React.createClass({
    propTypes: {
        goToPage: React.PropTypes.func,
        activeTab: React.PropTypes.number,
        tabs: React.PropTypes.array,
        backgroundColor: React.PropTypes.string,
        activeTextColor: React.PropTypes.string,
        inactiveTextColor: React.PropTypes.string,
        scrollOffset: React.PropTypes.number,
        style: View.propTypes.style,
        tabStyle: View.propTypes.style,
        tabsContainerStyle: View.propTypes.style,
        textStyle: Text.propTypes.style,
        renderTab: React.PropTypes.func,
        underlineStyle: View.propTypes.style,
        onScroll: React.PropTypes.func,
    },

    getDefaultProps() {
        return {
            scrollOffset: 52,
            activeTextColor: 'navy',
            inactiveTextColor: 'black',
            backgroundColor: null,
            style: {},
            tabStyle: {},
            tabsContainerStyle: {},
            underlineStyle: {},
        };
    },

    getInitialState() {
        this._tabsMeasurements = [];
        return {
            _leftTabUnderline: new Animated.Value(0),
            _widthTabUnderline: new Animated.Value(0),
            _containerWidth: null,
        };
    },

    componentDidMount() {
    },

    updateView() {
        const position = this.props.activeTab;
        console.log(position);
        const tabCount = this.props.tabs.length;
        const lastTabPosition = tabCount - 1;
        if (tabCount === 0) {
            return;
        }
        if (this.necessarilyMeasurementsCompleted(position, position === lastTabPosition)) {
            this.updateTabPanel(position);
            this.updateTabUnderline(position);
        }
    },

    necessarilyMeasurementsCompleted(position, isLastTab) {
        return this._tabsMeasurements[position] &&
            (isLastTab || this._tabsMeasurements[position + 1]) &&
            this._tabContainerMeasurements &&
            this._containerMeasurements;
    },

    updateTabPanel(position) {
        const containerWidth = this._containerMeasurements.width;
        const tabWidth = this._tabsMeasurements[position].width;
        const nextTabMeasurements = this._tabsMeasurements[position + 1];
        const nextTabWidth = nextTabMeasurements && nextTabMeasurements.width || 0;
        let newx = this._tabsMeasurements[position].left;

        newx -= (containerWidth - tabWidth - nextTabWidth) / 2;
        newx -= this._tabsMeasurements[position].width/2;
        newx = newx >= 0 ? newx : 0;
        if (Platform.OS === 'android') {
            this._scrollView.scrollTo({x: newScrollX, y: 0, animated: false, });
        } else {
            const rightBoundScroll = this._tabContainerMeasurements.width - (this._containerMeasurements.width);

            newx = newx > rightBoundScroll ? rightBoundScroll : newx;
            this._scrollView.scrollTo({x: newx, y: 0, animated: true,});
        }

    },

    updateTabUnderline(position) {
        const lineLeft = this._tabsMeasurements[position].left;
        const lineRight = this._tabsMeasurements[position].right;

        Animated.spring(
            this.state._leftTabUnderline,         // Auto-multiplexed
            {toValue: lineLeft} // Back to zero
        ).start();
        Animated.spring(
            this.state._widthTabUnderline,         // Auto-multiplexed
            {toValue: lineRight - lineLeft} // Back to zero
        ).start();
    },

    renderTab(name, page, isTabActive, onPressHandler, onLayoutHandler) {
        const {activeTextColor, inactiveTextColor, textStyle,} = this.props;
        const textColor = isTabActive ? activeTextColor : inactiveTextColor;
        const fontWeight = isTabActive ? 'bold' : 'normal';

        return <Button
            key={`${name}_${page}`}
            accessible={true}
            accessibilityLabel={name}
            accessibilityTraits='button'
            onPress={() => onPressHandler(page)}
            onLayout={onLayoutHandler}
        >
            <View style={[styles.tab, this.props.tabStyle,]}>
                <Text allowFontScaling={false} style={[{color: textColor, fontWeight,}, textStyle,]}>
                    {name}
                </Text>
            </View>
        </Button>;
    },

    measureTab(page, event) {
        const {x, width, height,} = event.nativeEvent.layout;
        this._tabsMeasurements[page] = {left: x, right: x + width, width, height,};
        this.updateView();
    },

    render() {
        const tabUnderlineStyle = {
            position: 'absolute',
            height: 4,
            backgroundColor: 'navy',
            bottom: 0,
        };

        const key = I18nManager.isRTL ? 'right' : 'left';
        const dynamicTabUnderline = {
            [`${key}`]: this.state._leftTabUnderline,
            width: this.state._widthTabUnderline
        };

        return <View
            style={[styles.container, {backgroundColor: this.props.backgroundColor,}, this.props.style,]}
            onLayout={this.onContainerLayout}
        >
            <ScrollView
                automaticallyAdjustContentInsets={false}
                ref={(scrollView) => {
                    this._scrollView = scrollView;
                }}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                directionalLockEnabled={true}
                onScroll={this.props.onScroll}
                bounces={false}
                scrollsToTop={false}
            >
                <View
                    style={[styles.tabs, {width: this.state._containerWidth,}, this.props.tabsContainerStyle,]}
                    ref={'tabContainer'}
                    onLayout={this.onTabContainerLayout}
                >
                    {this.props.tabs.map((name, page) => {
                        const isTabActive = this.props.activeTab === page;
                        const renderTab = this.props.renderTab || this.renderTab;
                        return renderTab(name, page, isTabActive, this.props.goToPage, this.measureTab.bind(this, page));
                    })}
                    <Animated.View style={[tabUnderlineStyle, dynamicTabUnderline, this.props.underlineStyle,]}/>
                </View>
            </ScrollView>
        </View>;
    },

    componentWillReceiveProps(nextProps) {
        // If the tabs change, force the width of the tabs container to be recalculated
        if (JSON.stringify(this.props.tabs) !== JSON.stringify(nextProps.tabs) && this.state._containerWidth) {
            this.setState({_containerWidth: null,});
        }
    },

    onTabContainerLayout(e) {
        this._tabContainerMeasurements = e.nativeEvent.layout;
        let width = this._tabContainerMeasurements.width;
        if (width < WINDOW_WIDTH) {
            width = WINDOW_WIDTH;
        }
        this.setState({_containerWidth: width,});
        this.updateView();
    },

    onContainerLayout(e) {
        this._containerMeasurements = e.nativeEvent.layout;
        this.updateView();
    }
});

module.exports = ScrollTab;

const styles = StyleSheet.create({
    tab: {
        height: 49,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 20,
        paddingRight: 20,
    },
    container: {
        height: 50,
        borderWidth: 1,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderColor: '#ccc',
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});
