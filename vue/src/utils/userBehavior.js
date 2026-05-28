import request from '@/utils/request'

// 添加用户行为 type: 1浏览 2收藏 3点赞
export function addUserBehavior(data) {
    return request({
        url: '/userBehavior/add',
        method: 'post',
        data
    })
}

// 更新用户行为（取消收藏/取消点赞）
export function updateUserBehavior(data) {
    return request({
        url: '/userBehavior/update',
        method: 'put',
        data
    })
}

// 获取行为列表
export function getBehaviorPage(params) {
    return request({
        url: '/userBehavior/selectPage',
        method: 'get',
        params
    })
}

// 查询当前用户是否已收藏该资源
export function getIsCollected(params) {
    return request({
        url: '/userBehavior/isCollected',
        method: 'get',
        params
    })
}
// 查询是否收藏
export function hasCollect(params) {
    return request({
        url: '/userBehavior/hasCollect',
        method: 'get',
        params
    })
}

// 切换收藏
export function toggleCollect(data) {
    return request({
        url: '/userBehavior/toggleCollect',
        method: 'post',
        data
    })
}