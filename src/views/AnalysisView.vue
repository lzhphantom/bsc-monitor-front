<template lang="pug">
  div#targetMonitor
    .top
      span
      a-space
        a-button(shape="round" @click="fetchData") 刷新
          template(#icon)
            icon-refresh
    .mb-16
    a-form(layout="inline" :model="searchParams" @submit="startPolling")
      a-form-item(label="地址")
        a-input(v-model="searchParams.address" placeholder="请输入地址" @blur="queryTagList" allow-clear)
      a-form-item(label="标签")
        a-select(v-model="searchParams.tag" :options="tagOptions" placeholder="请选择标签" allow-clear allow-search)
      a-form-item(label="最小block_num" )
        a-input-number(v-model="searchParams.min_block_num" placeholder="请输入最小冻结数字" allow-clear)
      a-form-item(label="最大block_num" )
        a-input-number(v-model="searchParams.max_block_num" placeholder="请输入最大冻结数字" allow-clear)
      a-form-item(label="最小值" )
        a-input-number(v-model="searchParams.min_value" placeholder="请输入最小值" allow-clear)
      a-form-item(label="最大值" )
        a-input-number(v-model="searchParams.max_value" placeholder="请输入最大值" allow-clear)
      a-form-item(label="是否新地址" )
        a-select(v-model="searchParams.is_new_address" placeholder="请选择" :options="[{label:'是',value:true},{label: '否',value:false}]" allow-clear)
      a-form-item(label="轮询时间" )
        a-select(v-model="searchTime" placeholder="轮询时间间隔" :options="searchTimeOptions")
      a-form-item
        a-button(type="primary" html-type="submit" v-if="!isVisible" ) 开始监控
        a-button(type="primary" status="danger" @click="stopPolling" v-else) 停止监控
    .mb-16
    .table-scroll
      a-table(
        :columns="columns"
        :data="dataList"
        stripe
        style="min-width: 1400px;"
        :pagination="false"
      )
        template(#address="{ record }")
          a-space
            a-link(:href="`https://bscscan.com/address/${record.Address}`" target="_blank") {{ formatAddress(record.Address) }}
            a-button(
              type="text"
              size="mini"
              @click="copyToClipboard(record.Address)"
            )
              template(#icon)
                icon-copy
        template(#TxHash="{ record }")
          a-link(:href="`https://bscscan.com/tx/${record.TxHash}`" target="_blank") {{ formatHash(record.TxHash) }}
        template(#FromAddress="{ record }")
          a-link(:href="`https://bscscan.com/address/${record.FromAddress}`" target="_blank") {{ formatAddress(record.FromAddress) }}
        template(#BlockNumber="{ record }")
          a-link(:href="`https://bscscan.com/block/${record.BlockNumber}`" target="_blank") {{ record.BlockNumber }}
        template(#Value="{ record }")
          span {{ formatValue(record.Value) }}
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, shallowRef } from 'vue'
import { analysis, getAllTags, queryTagByFromAddress } from '@/api/monitor.ts'
import { IconCopy, IconRefresh } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import dayjs from 'dayjs'

const columns = shallowRef([
  {
    title: 'ID',
    dataIndex: 'ID',
  },
  {
    title: '地址',
    dataIndex: 'Address',
    slotName: 'address',
  },
  {
    title: '标签',
    dataIndex: 'Tag',
  },
  {
    title: '文本哈希',
    dataIndex: 'TxHash',
    slotName: 'TxHash',
  },
  {
    title: '值',
    dataIndex: 'Value',
    slotName: 'Value',
  },
  {
    title: '源地址',
    dataIndex: 'FromAddress',
    slotName: 'FromAddress',
  },
  {
    title: 'block_num',
    dataIndex: 'BlockNumber',
    slotName: 'BlockNumber',
  },
  {
    title: '是否新地址',
    dataIndex: 'IsNewAddress',
    render: ({ record }) => {
      return record.IsNewAddress ? '是' : '否'
    },
  },
  {
    title: '创建时间',
    dataIndex: 'CreatedAt',
    render: ({ record }) => {
      return dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  {
    title: '更新时间',
    dataIndex: 'UpdatedAt',
    render: ({ record }) => {
      return dayjs(record.UpdatedAt).format('YYYY-MM-DD HH:mm:ss')
    },
  },
  // {
  //   title: '操作',
  //   key: 'action',
  // },
])
const searchTime = ref(5000)

// 数据
const dataList = ref<API.AnalysisResult[]>([])
const total = ref(0)

const isVisible = ref(false)
const timer = ref<any>(null)
// 清理定时器
onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
})

const startPolling = () => {
  if (timer.value) return
  fetchData()
  timer.value = setInterval(fetchData, searchTime.value)
  isVisible.value = true
}
const stopPolling = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
    isVisible.value = false
  }
}

const searchParams = reactive<API.AnalysisQuery>({
  is_new_address: true,
  order_by: 'block_number',
  order: 'desc',
})

// 获取数据
const fetchData = async () => {
  const res = await analysis(searchParams)
  if (res.data) {
    dataList.value = res.data.results ?? []
    total.value = res.data.total ?? 0
  } else {
    Message.error('获取数据失败，' + res.message)
  }
}

// 页面加载时请求一次
onMounted(() => {
  getAllTagList()
})
// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    Message.success('地址已复制')
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    Message.success('地址已复制')
  }
}
const tagOptions = ref([])
const getAllTagList = async () => {
  const res = await getAllTags()
  if (res.data) {
    tagOptions.value = res.data.tags.map((tag) => {
      return {
        label: tag.tag,
        value: tag.tag,
      }
    })
  }
}

const queryTagList = async ()=>{
  const res = await queryTagByFromAddress({from_address:searchParams.address})
  if (res.data){
    tagOptions.value = res.data.tags.map((tag)=>{
      return {
        label: tag.tag,
        value: tag.tag,
      }
    })
  }
}

// 格式化地址：保留前8位和后8位
const formatAddress = (addr: string) => {
  if (!addr) return ''
  if (addr.length <= 16) return addr
  return addr.slice(0, 8) + '...' + addr.slice(-8)
}
// 格式化hash：保留前10位，后面用...
const formatHash = (hash: string) => {
  if (!hash) return ''
  if (hash.length <= 10) return hash
  return hash.slice(0, 10) + '...'
}

// 在 script 里添加 formatValue 方法
const formatValue = (val: string | number) => {
  const num = Number(val)
  if (isNaN(num)) return val
  return num.toFixed(5)
}

const searchTimeOptions = [
  {label: '5秒', value: 5000},
  {label: '10秒', value: 10000},
  {label: '15秒', value: 15000},
  {label: '20秒', value: 20000},
]
</script>

<style scoped lang="scss">
#targetMonitor {
  .top {
    display: flex;
    justify-content: space-between;
  }
}
.table-scroll {
  overflow-x: auto;
  width: 100%;
}
.table-scroll .arco-table {
  min-width: 1500px;
}
</style>