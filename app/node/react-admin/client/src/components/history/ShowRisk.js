import React from 'react'
import {List, Datagrid, TextField,  ReferenceManyField, SingleFieldList,ChipField,ShowButton, EditButton, DeleteButton} from 'react-admin'
const ShowRisk = (props) => {
    return <List {...props}>
        <Datagrid>
            <TextField source ='id'/>
            <TextField source ='rname'label='Risk Name'/>
            <TextField source ='assessment.aid' label='Assessment'/>
            <TextField source ='ownerorg.orgname' label='Owner'/>
            {/* <TextField source ='ownerorg.suborgname'/> */}
            <TextField source ='likelihood'/>
            <TextField source ='impact'/>
            <TextField source ='acceptance'/>
            <TextField source ='value'/>
            <TextField source ='rstatus'label='Status'/>
            {/* <ReferenceManyField label="Affected By" reference="mitigations" target="riskdeps.rdid">
                <SingleFieldList>
                    <ChipField source="mname" />
                </SingleFieldList>
            </ReferenceManyField> */}
            <TextField source ='rorganization.orgname' label='Organization'/>
           
        </Datagrid>

    </List>
}

export default ShowRisk;