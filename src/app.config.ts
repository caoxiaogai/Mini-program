export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/material/index',
    'pages/analysis/index',
    'pages/mine/index',
    'pages/materialDetail/index',
    'pages/aiGenerate/index',
    'pages/contentDetail/index',
    'pages/customerDetail/index',
    'pages/docViewer/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'AI销售助手',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
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
        pagePath: 'pages/material/index',
        text: '素材',
        iconPath: 'assets/tabbar/material.png',
        selectedIconPath: 'assets/tabbar/material-selected.png'
      },
      {
        pagePath: 'pages/analysis/index',
        text: '分析',
        iconPath: 'assets/tabbar/analysis.png',
        selectedIconPath: 'assets/tabbar/analysis-selected.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png'
      }
    ]
  }
})
