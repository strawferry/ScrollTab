# ScrollTab
## 效果展示

![](https://github.com/strawferry/ScrollTab/blob/master/gif.gif?raw=true)

## 安装方法

`npm i --save react-native-scrolltab`

## js 调用

```javascript
import ScrollTab from 'react-native-scrolltab';

export default class exsample extends Component {
  // 构造
    constructor(props) {
      super(props);
      // 初始状态
      this.state = {
          activeTab: 0
      };
    }
  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5FCFF'}}}>
        <ScrollTab tabs={['item1','item2','item3','item-4-item','item5','item6','item7','item8']}
             activeTab={this.state.activeTab}
             goToPage={(index)=>{this.setState({activeTab: index})}}
        />
      </View>
    );
  }
}

```