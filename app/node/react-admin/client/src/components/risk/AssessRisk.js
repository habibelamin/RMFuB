import React from 'react'
import { Create, SimpleForm, TextInput, required, DateInput } from 'react-admin'

const AssessRisk = (props) => {
    return (
        <Create title='Assess a Risk'{...props}>
            <SimpleForm>
                <TextInput source ='rname' validate={[required()]}/>
                <TextInput source ='assessment.aid' validate={[required()]}/>
                <TextInput multiline source ='rdescription'/>  
                <TextInput source ='likelihood' validate={[required()]}/>
                <TextInput source ='impact' validate={[required()]}/>
                <TextInput source ='acceptance' validate={[required()]}/>
            </SimpleForm>

        </Create>
    )
}

export default AssessRisk