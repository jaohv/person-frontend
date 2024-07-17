/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, forwardRef } from "react"
import { Button, Modal, Input, Form, Table, Space, Popconfirm, message, DatePicker, Select } from "antd"
import type { ColumnsType } from "antd/es/table"
import moment from "moment"
import InputMask from "react-input-mask"

import { api } from "./services/api"

interface PersonData {
  id: number
  name: string
  gender: string
  birthDate: string
  phoneNumber: string
  email: string
}


const MaskedInput = forwardRef((props: any, ref: any) => (
  <InputMask {...props} ref={ref}>
    {(inputProps: any) => <Input {...inputProps} />}
  </InputMask>
))

const App: React.FC = () => {
  const [data, setData] = useState<PersonData[]>([])
  const [filteredData, setFilteredData] = useState<PersonData[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<PersonData | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    async function loadPeople() {
      try {
        const response = await api.get("/person")
        const responseData = response.data as PersonData[]
        setData(responseData)
        setFilteredData(responseData)
      } catch (error) {
        console.log("Erro ao carregar pessoa:", error)
      }
    }
    loadPeople()
  }, [])

  const handleAdd = async (values: PersonData) => {
    try {
      const formattedValues = {
        ...values,
        birthDate: moment(values.birthDate).toISOString(),
      }

      const response = await api.post("/person", formattedValues)
      const newPerson = response.data

      setData(prevData => [...prevData, newPerson])
      setFilteredData(prevData => [...prevData, newPerson])

      setIsModalOpen(false)
      message.success("Pessoa adicionada com sucesso")
      window.location.reload()
    } catch (error) {
      console.log("Erro ao adicionar pessoa:", error)
      message.error("Erro ao adicionar pessoa")
    }
  }

  const handleEdit = async (values: PersonData) => {
    try {
      const response = await api.put(`/person/${editingPerson!.id}`, {
        ...values,
        birthDate: moment(values.birthDate).toISOString(),
      })

      const updatedPerson = response.data

      setData(prevData =>
        prevData.map(person => (person.id === editingPerson!.id ? updatedPerson : person))
      )
      setFilteredData(prevData =>
        prevData.map(person => (person.id === editingPerson!.id ? updatedPerson : person))
      )

      setEditingPerson(null)
      form.resetFields()
      setIsModalOpen(false)
      message.success("Pessoa editada com sucesso!")
    } catch (error) {
      console.log("Erro ao editar pessoa:", error)
      message.error("Erro ao editar pessoa")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/person/${id}`)
      
      setData(prevData => prevData.filter(person => person.id !== id))
      setFilteredData(prevData => prevData.filter(person => person.id !== id))
      
      message.success("Pessoa deletada com sucesso!")
    } catch (error) {
      console.log("Erro ao deletar pessoa:", error)
      message.error("Erro ao deletar pessoa")
    }
  }

  const handleOpenModal = (person?: PersonData) => {
    if (person) {
      form.setFieldsValue({
        ...person,
        birthDate: moment(person.birthDate, "YYYY-MM-DD"),
      })
      setEditingPerson(person)
    } else {
      form.resetFields()
    }
    setIsModalOpen(true)
  }

  const handleCancelModal = () => {
    setEditingPerson(null)
    form.resetFields()
    setIsModalOpen(false)
  }

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then(values => {
        if (editingPerson) {
          handleEdit(values)
        } else {
          handleAdd(values)
        }
      })
      .catch(info => {
        console.log("Erro de validação:", info)
      })
  }

  const handleSearch = (value: string) => {
    const filtered = data.filter(person =>
      person.name.toLowerCase().includes(value.toLowerCase()) ||
      person.email.toLowerCase().includes(value.toLowerCase())
    )
    
    setFilteredData(filtered)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value)
  }

  const columns: ColumnsType<PersonData> = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Gênero",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Data de nascimento",
      dataIndex: "birthDate",
      key: "birthDate",
      render: (text: string) => moment(text).format("DD-MM-YYYY"),
    },
    {
      title: "Telefone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => handleOpenModal(record)}>Editar</Button>
          <Popconfirm
            title="Você tem certeza que deseja deletar?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sim"
            cancelText="Não"
          >
            <Button danger>Deletar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="container">
      <div className="content">
        <Button type="primary" onClick={() => handleOpenModal()}>
          + Nova pessoa
        </Button>
        <Input
          placeholder="Buscar por nome ou email"
          style={{ width: 300, marginLeft: 10 }}
          onChange={handleInputChange}
        />
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 20 }}
          rowKey="id"
        />
        <Modal
          title={editingPerson ? "Editar pessoa" : "Criar pessoa"}
          open={isModalOpen}
          onOk={handleFormSubmit}
          onCancel={handleCancelModal}
        >
          <Form form={form} layout="vertical" name="personForm">
            <Form.Item name="name" label="Nome" rules={[{ required: true, message: "Por favor coloque o nome"}, 
            { pattern: /^[a-zA-Z\s]+$/, message: "O nome só pode conter letras e espaços" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Por favor coloque um email válido"}]}>
              <Input />
            </Form.Item>
            <Form.Item name="phoneNumber" label="Telefone" rules={[{ required: true, message: "Por favor coloque o número de telefone", min: 15, max: 15 }]}>
              <MaskedInput maskChar={null} mask="(99) 99999-9999" />
            </Form.Item>
            <Form.Item name="birthDate" label="Data de nascimento" rules={[{ required: true, message: "Por favor selecione uma data de nascimento" }]}>
              <DatePicker format="DD-MM-YYYY" />
            </Form.Item>
            <Form.Item name="gender" label="Gênero" rules={[{ required: true, message: "Por favor selecione um gênero" }]}>
              <Select>
                <Select.Option value="Masculino">Masculino</Select.Option>
                <Select.Option value="Feminino">Feminino</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default App
