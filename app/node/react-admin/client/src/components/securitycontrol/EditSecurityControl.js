import React from 'react'
import { Edit, SimpleForm, TextInput, SelectInput, DateInput } from 'react-admin'

const EditSecurityControl = (props) => {
    return (
        <Edit title='Assess a Risk'{...props}>
            <SimpleForm>
                <TextInput disabled source='id'/>
                <TextInput source ='sname'/>
                <TextInput multiline source ='sdescription'/>
                <TextInput source ='apresponsible'/>
                <TextInput disabled source ='sorganization.orgname'/>
                <TextInput disabled source ='sorganization.suborgname'/>
                <SelectInput source="sstatus" choices={[
                    { id: 'APPLIED', name: 'Applied' },
                    ]} />
                <TextInput disabled source ='supid'/>
                <TextInput disabled source ='mdid'/>
                <TextInput disabled source ='scdeps'/>
            </SimpleForm>

        </Edit>
    )
}

export default EditSecurityControl