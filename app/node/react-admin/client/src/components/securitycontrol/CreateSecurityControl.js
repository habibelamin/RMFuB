import React from 'react'
import { Create, SimpleForm, TextInput,required, ReferenceInput,SelectInput } from 'react-admin'

const CreateSecurityControl = (props) => {
    return (
        <Create title='Create a Mitigation'{...props}>
            <SimpleForm>
                <TextInput source ='sname' validate={[required()]}/>
                <TextInput multiline source ='sdescription'/>  
                <TextInput source ='apresponsible' validate={[required()]}/>
                {/* <TextInput source ='supid'/> */}
                <ReferenceInput source="supid" reference="securitycontrols" target="id">
                    <SelectInput optionText="sname" />
                </ReferenceInput>
                {/* <TextInput source ='mdid' validate={[required()]}/> */}
                <ReferenceInput source="mdid" reference="mitigations" target="id">
                    <SelectInput optionText="mname" />
                </ReferenceInput>
            </SimpleForm>

        </Create>
    )
}

export default CreateSecurityControl