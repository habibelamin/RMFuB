import React from 'react'
import { Create, ReferenceInput,SelectInput,ArrayInput, SimpleForm, SimpleFormIterator, NumberInput, ReferenceManyField, SingleFieldList, ChipField, TextInput, required, DateInput } from 'react-admin'

const CreateMitigation = (props) => {
    return (
        <Create title='Create a Mitigation'{...props}>
            <SimpleForm>
                <TextInput label="Name" source='mname' validate={[required()]} />
                <TextInput label="Description" multiline source='mdescription' />
                <TextInput label="Approve Responsible" source='avresponsible' validate={[required()]} />
                {/* <TextInput source ='time'/> */}
                {/* <TextInput source ='riskdeps'/> */}
                <ArrayInput label="Risk Dependencies" source="riskdeps">
                    <SimpleFormIterator>
                        {/* <TextInput source="rdid" /> */}
                        <ReferenceInput label="Risk" source="rdid" reference="risks" target="id" validate={[required()]} >
                            <SelectInput optionText="rname" />
                        </ReferenceInput>
                        {/* <ReferenceManyField label="Risk" reference="risks" target="rdid" validate={[required()]}>
                            <SingleFieldList>
                                <ChipField source="id" />
                            </SingleFieldList>
                        </ReferenceManyField> */}
                        <TextInput source="rdname" validate={[required()]} />
                        <NumberInput source="mlikelihood" format={v => v } parse={v => parseFloat(v)} label="Likelihood" validate={[required()]} />
                        <NumberInput source="mimpact" format={v => v} parse={v => parseFloat(v)} label="Impact" validate={[required()]} />
                        {/* <TextInput source="mlikelihood" />
                        <TextInput source="mimpact" /> */}
                    </SimpleFormIterator>
                </ArrayInput>
            </SimpleForm>

        </Create>
    )
}

export default CreateMitigation
