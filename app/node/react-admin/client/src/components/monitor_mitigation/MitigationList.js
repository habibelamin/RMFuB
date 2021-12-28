import React from 'react'
import {List, Datagrid, TextField, ReferenceManyField, SingleFieldList,ChipField, EditButton, DeleteButton} from 'react-admin'
const MonitorMitigationList = (props) => {
    return <List {...props}>
        <Datagrid>
            <TextField source ='id'/>
            <TextField label="Name" source ='mname'/>
            <TextField label="Approve Responsible" source ='avresponsible'/>
            <TextField label="Organization" source ='morganization.orgname'/>
            {/* <TextField label="SubOrganization" source ='morganization.suborgname'/> */}
            {/* <ReferenceManyField label="SecurityControls" reference="securitycontrols" target="mdid">
                <SingleFieldList>
                    <ChipField source="id" />
                </SingleFieldList>
            </ReferenceManyField> */}
            <TextField label="Status" source ='mstatus'/>
        </Datagrid>

    </List>
}

export default MonitorMitigationList