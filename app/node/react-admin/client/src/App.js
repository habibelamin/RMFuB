import React from 'react'
import {Admin, Resource} from 'react-admin'
import restProvider from 'ra-data-simple-rest'
import { fetchUtils } from 'ra-core';
import simpleRestProvider from 'ra-data-simple-rest';
import RiskList from './components/risk/RiskList.js'
import ShowRisk from './components/risk/ShowRisk.js'
import AssessRisk from './components/risk/AssessRisk.js'
import EditRisk from './components/risk/EditRisk.js'
import MitigationList from './components/mitigation/MitigationList.js'
import CreateMitigation from './components/mitigation/CreateMitigation.js'
import ShowMitigation from './components/mitigation/ShowMitigation.js'
import EditMitigation from './components/mitigation/EditMitigation.js'
import SecurityControlList from './components/securitycontrol/SecurityControlList.js'
import CreateSecurityControl from './components/securitycontrol/CreateSecurityControl.js'
import EditSecurityControl from './components/securitycontrol/EditSecurityControl.js'
import ShowSecurityControl from './components/securitycontrol/ShowSecurityControl.js'
import MonitorRiskList from './components/monitor_risk/RiskList.js'
import MonitorMitigationList from './components/monitor_mitigation/MitigationList.js'
import MonitorSecurityControlList from './components/monitor_securitycontrol/SecurityControlList.js'
import HistoryRiskList from './components/history/HistoryRiskList.js'
import myDataProvider from './components/customDataResolver'


function App() {
  // return <Admin dataProvider={restProvider('http://localhost:3005/api')}>
  // return  <Admin dataProvider={simpleRestProvider('http://localhost:3005/api', fetchUtils.fetchJson, 'X-Total-Count')}>
  return  <Admin dataProvider={myDataProvider}>
    
    <Resource name='risks' list={RiskList} show={ShowRisk} create={AssessRisk} edit={EditRisk} />
    <Resource name='mitigations' show ={ShowMitigation} list={MitigationList} create={CreateMitigation} edit={EditMitigation} />
    <Resource name='securitycontrols' show ={ShowSecurityControl} list={SecurityControlList} create={CreateSecurityControl} edit={EditSecurityControl} />
    <Resource name='monitor/risks' list={MonitorRiskList}  />
    <Resource name='monitor/mitigations' list={MonitorMitigationList} />
    <Resource name='monitor/securitycontrols' list={MonitorSecurityControlList} />
    <Resource name='history/risk' list={HistoryRiskList}  />
  </Admin>
}

export default App;
