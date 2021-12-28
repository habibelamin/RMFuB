import React from 'react'
import { Edit, ReferenceInput, SimpleForm, TextInput, SelectInput, ArrayInput, SimpleFormIterator, NumberInput, ReferenceArrayInput, SelectArrayInput, ReferenceManyField, SingleFieldList, ChipField, required, DateInput } from 'react-admin'

const EditMitigation = (props) => {
    return (
        <Edit title='Assess a Risk'{...props}>
            <SimpleForm>
                <TextInput disabled source='id' />
                <TextInput label="Name" source='mname' />
                <TextInput label="Description" multiline source='mdescription' />
                <TextInput label="Approve Responsible" source='avreponsible' />
                <TextInput label="Organization" disabled source='morganization.orgname' />
                <TextInput label="SubOrganization" disabled source='morganization.suborgname' />
                <SelectInput label="Status" source="mstatus" choices={[
                    { id: 'APPROVED', name: 'Approve' },
                ]} />

                {/* <TextInput source ='riskdeps'/> */}
                <ArrayInput label="Risk Dependencies" source="riskdeps">
                    <SimpleFormIterator>
                        {/* <TextInput source="rdid" /> */}


                        {/* <ReferenceManyField  reference="risks" target="rdid" validate={[required()]}>
                            <SingleFieldList>
                                <ChipField source="id" />
                            </SingleFieldList>
                        </ReferenceManyField> */}
                        <ReferenceInput source="rdid" reference="risks" target="id">
                            <SelectInput optionText="rname" />
                        </ReferenceInput>

                        <TextInput source="rdname" validate={[required()]} />
                        <NumberInput source="mlikelihood" format={v => v } parse={v => parseFloat(v)} label="Likelihood" validate={[required()]} />
                        <NumberInput source="mimpact" format={v => v } parse={v => parseFloat(v)} label="Impact" validate={[required()]} />
                        {/* <TextInput source="mlikelihood" />
                        <TextInput source="mimpact" /> */}
                    </SimpleFormIterator>
                </ArrayInput>
                {/* <TextInput disabled source ='scdeps'/> */}
                <ReferenceManyField label="Security Controls" reference="securitycontrols" target="mdid">
                    <SingleFieldList disabled>
                        <ChipField source="sname" />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleForm>

        </Edit>
    )
}

export default EditMitigation