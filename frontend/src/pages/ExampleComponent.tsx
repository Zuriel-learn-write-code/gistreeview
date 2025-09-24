import DefaultInputs from "../components/form/form-elements/DefaultInputs";
import CheckboxComponents from "../components/form/form-elements/CheckboxComponents";
import RadioButtons from "../components/form/form-elements/RadioButtons";
import TextAreaInput from "../components/form/form-elements/TextAreaInput";
import SelectInputs from "../components/form/form-elements/SelectInputs";
import DropzoneComponent from "../components/form/form-elements/DropZone";
import InputStates from "../components/form/form-elements/InputStates";
import InputGroup from "../components/form/form-elements/InputGroup";
import FileInputExample from "../components/form/form-elements/FileInputExample";
import ToggleSwitch from "../components/form/form-elements/ToggleSwitch";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";
import DataTable from "../components/tables/DataTable";

const ExampleComponent = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Example Page</h1>
      <p className="mb-8">Demo semua komponen form dari folder <code>components/form</code>:</p>
      <DefaultInputs />
      <CheckboxComponents />
      <RadioButtons />
      <TextAreaInput />
      <SelectInputs />
      <DropzoneComponent />
      <InputStates />
      <InputGroup />
      <FileInputExample />
      <ToggleSwitch />
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Contoh Tabel</h2>
        <BasicTableOne />
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">DataTable (Search, Pagination, Entries)</h2>
          <DataTable />
        </div>
      </div>
    </div>
  );
};

export default ExampleComponent;
