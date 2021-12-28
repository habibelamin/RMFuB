import React from 'react'
import {List, Datagrid, TextField, ReferenceManyField, SingleFieldList,ChipField,ReferenceField,  EditButton, DeleteButton} from 'react-admin'
const MonitorSecurityControlList = (props) => {
    return <List {...props}>
        <Datagrid>
            <TextField source ='id'/>
            <TextField source ='sname' label='Name'/>
            <TextField source ='mdid' label='Mitigation'/>
            <TextField source ='supid'label='Related Security Control'/>
            {/* <ReferenceField label="Mitigation" source="mdid" reference="mitigations" target="id">
                <TextField source="mname" />
            </ReferenceField>
            <ReferenceField label="Related SecurityControl" source="supid" reference="securitycontrols" target="id">
                <TextField source="sname" />
            </ReferenceField> */}
            <TextField source ='apresponsible' label='Applier'/>
            <TextField source ='sorganization.orgname' label='Organization'/>
            {/* <TextField source ='sorganization.suborgname'/> */}
            <TextField source ='sstatus' label='Status'/>
         
        </Datagrid>

    </List>
}

export default MonitorSecurityControlList