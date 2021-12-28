import React from 'react'
import { Edit, SimpleForm, TextInput, DateInput } from 'react-admin'

const EditRisk = (props) => {
    return (
        <Edit title='Assess a Risk'{...props}>
            <SimpleForm>
                <TextInput disabled source='id'/>
                <TextInput source ='rname'/>
                <TextInput source ='assessment.aid'/>
                <TextInput multiline source ='rdescription'/>
                <TextInput disabled source ='ownerorg.orgname'/>
                <TextInput disabled source ='ownerorg.suborgname'/>
                <TextInput source ='likelihood'/>
                <TextInput source ='impact'/>
                <TextInput source ='acceptance'/>
                <TextInput disabled source ='rstatus'/>
                <TextInput disabled source ='rorganization.orgname'/>
            </SimpleForm>

        </Edit>
    )
}

export default EditRisk