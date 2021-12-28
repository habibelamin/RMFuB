import React from 'react'
import {List, Datagrid, TextField,  ReferenceManyField, SingleFieldList,ChipField,ShowButton, EditButton, DeleteButton} from 'react-admin'
const HistoryRiskList = (props) => {
    return <List {...props}>
        <Datagrid>
            <TextField source ='records.id'/>
            <TextField source ='records.rname'label='Risk Name'/>
            <TextField source ='records.assessment.aid' label='Assessment'/>
            <TextField source ='records.ownerorg.orgname' label='Owner'/>
            {/* <TextField source ='ownerorg.suborgname'/> */}
            <TextField source ='records.likelihood'/>
            <TextField source ='records.impact'/>
            <TextField source ='records.acceptance'/>
            <TextField source ='records.value'/>
            <TextField source ='records.rstatus'label='Status'/>
            {/* <ReferenceManyField label="Affected By" reference="mitigations" target="riskdeps.rdid">
                <SingleFieldList>
                    <ChipField source="mname" />
                </SingleFieldList>
            </ReferenceManyField> */}
            <TextField source ='records.rorganization.orgname' label='Organization'/>
            <TextField source ='records.txId' label='Transaction'/>
            <TextField source ='records.timestamp' label='Timestamp'/>
        </Datagrid>

    </List>
}

export default HistoryRiskList