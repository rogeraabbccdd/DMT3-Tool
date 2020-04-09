module.exports = {
  'transpileDependencies': [
    'vuetify'
  ],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        publish: ['github'],
        productName: 'DMT3 Tool'
      }
    }
  }
}
