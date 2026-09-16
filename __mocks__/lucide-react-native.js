const React = require('react');
const { View } = require('react-native');

module.exports = new Proxy(
  {},
  {
    get: (_target, prop) => {
      const Icon = (props) => React.createElement(View, { testID: `icon-${String(prop)}`, ...props });
      Icon.displayName = String(prop);
      return Icon;
    },
  },
);
