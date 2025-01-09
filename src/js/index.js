import "../css/intro.css";
import "../css/app.css";

import React         from 'react'
import ReactDOM      from 'react-dom'
import App           from './containers/App'
import {Provider}    from 'react-redux'
import {createStore} from 'redux'
import rootReducer   from './reducers'
import '../css/app.css'

let store = createStore(rootReducer);

ReactDOM.render(
  <Provider store={store} >
	  <App />
	</Provider>,
  document.getElementById('container')
);
