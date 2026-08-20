export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/analysis/index',
    'pages/mine/index',
    'pages/material/index',
    'pages/materialDetail/index',
    'pages/materialPublish/index',
    'pages/aiGenerate/index',
    'pages/contentDetail/index',
    'pages/customerDetail/index',
    'pages/docViewer/index',
    'pages/notification/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '阿宝AI',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#0EC8D9',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png'
      },
      {
        pagePath: 'pages/analysis/index',
        text: '分析',
        iconPath: 'assets/tabbar/analysis.png',
        selectedIconPath: 'assets/tabbar/analysis-selected.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '排名',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png'
      }
    ]
  }
})
